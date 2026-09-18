const crypto = require("crypto");
const { Op } = require("sequelize");
const {
    Campaign,
    CampaignLead,
    ClientLead,
    MasterContact,
    LeadEngagement,
    EmailProcessingJob
} = require("leadpulse-data-model");

const { summaryLogger, failureLogger } = require("../utils/logger");
const templateService = require("./template.service");
const sendGridService = require("./sendgrid.service");

const EMAIL_BATCH_SIZE = Number(process.env.EMAIL_BATCH_SIZE) || 50;
const EMAIL_BATCH_DELAY_MS = Number(process.env.EMAIL_BATCH_DELAY_MS) || 200;

class EmailService {
    async processJob(job) {
        let processedEmails = 0;
        let successfulSends = 0;
        let failedSends = 0;

        try {
            const campaign = await Campaign.findByPk(job.campaignId);
            if (!campaign) throw new Error(`Campaign ${job.campaignId} not found`);

            // Compile template ONCE per job instead of thousands of times
            try {
                templateService.validateTemplate(campaign.emailBodyHtml);
            } catch (error) {
                throw new Error(`Invalid email template in campaign ${campaign.id}: ${error.message}`);
            }
            const compiledHtml = templateService.prepareSendGridTemplate(campaign.emailBodyHtml);

            // Fetch pending leads
            const campaignLeads = await CampaignLead.findAll({
                where: { campaignId: campaign.id, status: "pending" },
                include: [
                    {
                        model: ClientLead,
                        as: "clientLead",
                        where: { isDnc: false, isUnsubscribed: false },
                        include: [{ model: MasterContact, as: "masterContact" }]
                    }
                ]
            });

            const totalEmails = campaignLeads.length;
            await EmailProcessingJob.update({ totalEmails }, { where: { id: job.id } });

            if (totalEmails === 0) {
                await this.finalizeJob(job, campaign, 0, 0, 0);
                return;
            }

            summaryLogger.info("Email dispatch started", { jobId: job.id, campaignId: campaign.id, totalEmails });
            const batches = this.createBatches(campaignLeads, EMAIL_BATCH_SIZE);

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                summaryLogger.info("Processing email batch", { jobId: job.id, batchNumber: i + 1, totalBatches: batches.length });

                const result = await this.sendBatch(campaign, batch, compiledHtml, job);
                
                processedEmails += batch.length;
                successfulSends += result.successfulSends;
                failedSends += result.failedSends;

                await EmailProcessingJob.update({ processedEmails, successfulSends, failedSends }, { where: { id: job.id } });

                if (i < batches.length - 1) await this.sleep(EMAIL_BATCH_DELAY_MS);
            }

            summaryLogger.info("Email dispatch finished", { jobId: job.id, processedEmails, successfulSends, failedSends });
            await this.finalizeJob(job, campaign, processedEmails, successfulSends, failedSends);
        } catch (error) {
            failureLogger.error(`Fatal error processing job ${job.id}`, { error: error.message });
            await EmailProcessingJob.update({
                status: "Failed", processedEmails, successfulSends, failedSends
            }, { where: { id: job.id } });
            throw error;
        }
    }

    async sendBatch(campaign, leads, compiledHtml, job) {
        const validRecipients = [];
        const failedRecipients = [];

        // Prepare valid and failed buckets (No DB calls here, No compilation here)
        for (const lead of leads) {
            const contact = lead.clientLead?.masterContact;
            if (!contact || !contact.email) {
                failedRecipients.push({
                    lead,
                    trackingToken: this.createTrackingToken(),
                    bounceType: "missing_contact",
                    errorMessage: "No master contact or email exists for this lead"
                });
                continue;
            }
            validRecipients.push({ lead, contact, trackingToken: this.createTrackingToken() });
        }

        // Process failures (Bulk Create)
        if (failedRecipients.length > 0) {
            await this.recordFailedLeadsBulk(campaign, failedRecipients, job);
        }

        if (validRecipients.length === 0) {
            return { successfulSends: 0, failedSends: failedRecipients.length };
        }

        // Process Valid Sends
        try {
            if (!process.env.SENDGRID_API_KEY) throw new Error("SENDGRID_API_KEY is not configured");
            
            await sendGridService.sendBatch(campaign, validRecipients, compiledHtml);
            const sentAt = new Date();
            
            // 1. Bulk Create Engagements
            const engagementsToCreate = validRecipients.map(r => ({
                campaignId: campaign.id,
                clientLeadId: r.lead.clientLeadId,
                trackingToken: r.trackingToken,
                status: "sent",
                sentAt
            }));
            await LeadEngagement.bulkCreate(engagementsToCreate);

            // 2. Bulk Update Leads
            const validLeadIds = validRecipients.map(r => r.lead.id);
            await CampaignLead.update(
                { status: "completed", statusUpdatedAt: sentAt },
                { where: { id: { [Op.in]: validLeadIds } } }
            );

            return { successfulSends: validRecipients.length, failedSends: failedRecipients.length };

        } catch (error) {
            await this.recordFailedLeadsBulk(campaign, validRecipients.map(r => ({
                ...r, bounceType: "send_failed", errorMessage: error.message
            })), job);

            return { successfulSends: 0, failedSends: validRecipients.length + failedRecipients.length };
        }
    }

    async recordFailedLeadsBulk(campaign, failedRecords, job) {
        const engagements = failedRecords.map(f => ({
            campaignId: campaign.id,
            clientLeadId: f.lead.clientLeadId,
            trackingToken: f.trackingToken,
            status: "bounced",
            bounceType: f.bounceType,
            errorMessage: f.errorMessage
        }));

        await LeadEngagement.bulkCreate(engagements);

        const failedLeadIds = failedRecords.map(f => f.lead.id);
        await CampaignLead.update(
            { status: "completed", statusUpdatedAt: new Date() },
            { where: { id: { [Op.in]: failedLeadIds } } }
        );

        failedRecords.forEach(f => {
            failureLogger.error("Email send failed", {
                jobId: job.id, leadId: f.lead.id, bounceType: f.bounceType, errorMessage: f.errorMessage
            });
        });
    }

    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) batches.push(items.slice(i, i + batchSize));
        return batches;
    }

    createTrackingToken() {
        return crypto.randomBytes(32).toString("hex");
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async finalizeJob(job, campaign, processedEmails, successfulSends, failedSends) {
        await EmailProcessingJob.update({ status: "Completed", processedEmails, successfulSends, failedSends }, { where: { id: job.id } });
        await Campaign.update({ dispatchStatus: "sent" }, { where: { id: campaign.id } });
    }
}

module.exports = new EmailService();
