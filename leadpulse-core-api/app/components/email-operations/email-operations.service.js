const { Campaign, EmailProcessingJob, LeadEngagement, ClientLead, CampaignLead, sequelize } = require('leadpulse-data-model');
const { NotFoundError, BadRequestError } = require('../../lib/error');
const crypto = require('crypto');

class EmailOperationsService {
  async dispatchEmail(userId, campaignId) {
    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) throw new NotFoundError("Campaign not found");
    if (campaign.type !== 'email') throw new BadRequestError("This is not an email campaign");
    if (campaign.status !== 'active') throw new BadRequestError("Campaign must be active to dispatch");
    if (campaign.dispatchStatus !== 'not_sent') throw new BadRequestError("Campaign has already been dispatched or is currently sending");

    return await sequelize.transaction(async (t) => {
      // 1. Mark campaign as sending
      await campaign.update({ dispatchStatus: 'sending' }, { transaction: t });

      // 2. Create Email Processing Job for the microservice to pick up
      const pendingLeadsCount = await CampaignLead.count({ 
        where: { campaignId, status: 'pending' },
        transaction: t 
      });

      const job = await EmailProcessingJob.create({
        campaignId,
        status: 'Queued',
        totalEmails: pendingLeadsCount
      }, { transaction: t });

      return job;
    });
  }

  async getJobStatus(jobId) {
    const job = await EmailProcessingJob.findByPk(jobId);
    if (!job) throw new NotFoundError("Email processing job not found");
    return job;
  }

  async processSendgridWebhook(events) {
    // Expected to run outside of standard request/response if heavy, but for MVP synchronous processing:
    for (const event of events) {
      // We expect our tracking token to be passed back in unique_args by SendGrid
      const token = event.tracking_token;
      if (!token) continue;

      const engagement = await LeadEngagement.findOne({ where: { trackingToken: token } });
      if (!engagement) continue;

      const updates = {};
      if (event.event === 'delivered') {
        updates.status = 'delivered';
        updates.deliveredAt = new Date(event.timestamp * 1000);
      } else if (event.event === 'bounce') {
        updates.status = 'bounced';
        updates.bounceType = event.type;
        updates.errorMessage = event.reason;
      } else if (event.event === 'spamreport') {
        updates.status = 'spamreport';
      }
      
      if (Object.keys(updates).length > 0) {
        await engagement.update(updates);
      }
    }
  }

  async trackOpen(token) {
    const engagement = await LeadEngagement.findOne({ where: { trackingToken: token } });
    if (engagement) {
      await engagement.increment('openCount', { by: 1 });
      if (!engagement.openedAt) {
        await engagement.update({ openedAt: new Date() });
      }
    }
    // Return a 1x1 transparent GIF buffer
    return Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  }

  async trackClick(token, url) {
    const engagement = await LeadEngagement.findOne({ where: { trackingToken: token } });
    if (engagement) {
      await engagement.increment('clickCount', { by: 1 });
      if (!engagement.clickedAt) {
        await engagement.update({ clickedAt: new Date() });
      }
    }
    return url;
  }

  async trackUnsubscribe(token) {
    const engagement = await LeadEngagement.findOne({ where: { trackingToken: token } });
    if (engagement) {
      await sequelize.transaction(async (t) => {
        if (!engagement.unsubscribedAt) {
          await engagement.update({ unsubscribedAt: new Date() }, { transaction: t });
        }
        await ClientLead.update(
          { isUnsubscribed: true },
          { where: { id: engagement.clientLeadId }, transaction: t }
        );
      });
    }
  }
}
module.exports = EmailOperationsService;
