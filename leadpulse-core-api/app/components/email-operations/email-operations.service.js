const { Campaign, EmailProcessingJob, LeadEngagement, ClientLead, CampaignLead, ClientManager, LeadListMembership, sequelize } = require('leadpulse-data-model');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../../lib/error');

class EmailOperationsService {
  async verifyManagerControlsCampaign(userId, campaignId) {
    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) throw new NotFoundError("Campaign not found");
    const link = await ClientManager.findOne({ where: { userId, clientId: campaign.clientId } });
    if (!link) throw new ForbiddenError("You do not have permission to manage this campaign.");
    return campaign;
  }

  async dispatchEmail(userId, campaignId) {
    const campaign = await this.verifyManagerControlsCampaign(userId, campaignId);
    
    if (campaign.type !== 'email') throw new BadRequestError("This is not an email campaign");
    if (campaign.status !== 'active') throw new BadRequestError("Campaign must be active to dispatch");
    if (campaign.dispatchStatus !== 'not_sent') throw new BadRequestError("Campaign has already been dispatched or is currently sending");

    return await sequelize.transaction(async (t) => {
      await campaign.update({ dispatchStatus: 'sending' }, { transaction: t });

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

  async getJobStatus(userId, jobId) {
    const job = await EmailProcessingJob.findByPk(jobId, { include: [{ model: Campaign, as: 'campaign' }] });
    if (!job) throw new NotFoundError("Email processing job not found");
    
    const link = await ClientManager.findOne({ where: { userId, clientId: job.campaign.clientId } });
    if (!link) throw new ForbiddenError("You do not have permission to view this job.");
    
    return job;
  }

  async processSendgridWebhook(events) {
    for (const event of events) {
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
      if (!engagement.openedAt) await engagement.update({ openedAt: new Date() });
    }
    return Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  }

  async trackClick(token, url) {
    const engagement = await LeadEngagement.findOne({ where: { trackingToken: token } });
    if (engagement) {
      await engagement.increment('clickCount', { by: 1 });
      if (!engagement.clickedAt) await engagement.update({ clickedAt: new Date() });
    }
    return url;
  }

  async trackConversion(token) {
    const engagement = await LeadEngagement.findOne({ 
      where: { trackingToken: token },
      include: [{ model: Campaign, as: 'campaign' }] 
    });
    
    if (engagement && !engagement.convertedAt) {
      await sequelize.transaction(async (t) => {
        await engagement.update({ convertedAt: new Date() }, { transaction: t });
        
        // Only update local list membership to preserve history
        await LeadListMembership.update(
          { status: 'Converted' },
          { where: { clientLeadId: engagement.clientLeadId, leadListId: engagement.campaign.leadListId }, transaction: t }
        );
      });
    }
  }

  async trackUnsubscribe(token) {
    const engagement = await LeadEngagement.findOne({ where: { trackingToken: token } });
    if (engagement) {
      await sequelize.transaction(async (t) => {
        if (!engagement.unsubscribedAt) await engagement.update({ unsubscribedAt: new Date() }, { transaction: t });
        await ClientLead.update({ isUnsubscribed: true }, { where: { id: engagement.clientLeadId }, transaction: t });
      });
    }
  }
}
module.exports = EmailOperationsService;



