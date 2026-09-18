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


}
module.exports = EmailOperationsService;



