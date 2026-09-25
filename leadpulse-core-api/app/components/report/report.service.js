const { Campaign, CallRemark, LeadEngagement, ClientLead, MasterContact, ClientManager, sequelize } = require('leadpulse-data-model');
const { ForbiddenError, NotFoundError } = require('../../lib/error');

class ReportService {
  async verifyManagerControlsCampaign(user, campaignId) {
    if (!campaignId) return; 
    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) throw new NotFoundError("Campaign not found");
    if (user.role === 'client') {
      if (campaign.clientId !== user.clientId) {
        throw new ForbiddenError("You do not have permission to view this campaign's reports.");
      }
      return campaign;
    }
    const userId = user.id;
    const link = await ClientManager.findOne({ where: { userId, clientId: campaign.clientId } });
    if (!link) throw new ForbiddenError("You do not have permission to view this campaign's reports.");
    return campaign;
  }

  async getCampaignSummary(user, campaignId) {
    const campaign = await this.verifyManagerControlsCampaign(user, campaignId);

    const callOutcomes = await CallRemark.findAll({
      where: { campaignId },
      attributes: ['callOutcome', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['callOutcome'],
      raw: true
    });

    const emailStats = await LeadEngagement.findAll({
      where: { campaignId },
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true
    });

    const response = {
      campaign: { 
        id: campaign.id, 
        name: campaign.name, 
        type: campaign.type,
        pricingModel: campaign.pricingModel
      },
      callOutcomes,
      emailStats
    };

    // Strict Billing Calculation based on unique list membership
    if (campaign.pricingModel === 'cost_per_lead') {
      const { LeadListMembership } = require('leadpulse-data-model');
      const totalUniqueConversions = await LeadListMembership.count({
        where: { leadListId: campaign.leadListId, status: 'Converted' }
      });
      
      response.billing = {
        totalUniqueConversions,
        ratePerLead: campaign.ratePerLead,
        currentBill: totalUniqueConversions * (campaign.ratePerLead || 0)
      };
    } else if (campaign.pricingModel === 'flat_retainer') {
      response.billing = {
        retainerAmount: campaign.retainerAmount,
        currentBill: campaign.retainerAmount
      };
    }

    return response;
  }

  async exportEngagements(user, campaignId) {
    await this.verifyManagerControlsCampaign(user, campaignId);
    const whereClause = {};
    if (campaignId) whereClause.campaignId = campaignId;

    const engagements = await LeadEngagement.findAll({
      where: whereClause,
      include: [{
        model: ClientLead, as: 'clientLead',
        include: [{ model: MasterContact, as: 'masterContact', attributes: ['email', 'firstName', 'lastName'] }]
      }],
      attributes: ['trackingToken', 'status', 'openCount', 'clickCount', 'sentAt', 'openedAt', 'clickedAt', 'convertedAt'],
      order: [['createdAt', 'DESC']],
      raw: true,
      nest: true
    });

    return engagements.map(e => ({
      email: e.clientLead.masterContact.email,
      firstName: e.clientLead.masterContact.firstName,
      lastName: e.clientLead.masterContact.lastName,
      status: e.status,
      opens: e.openCount,
      clicks: e.clickCount,
      sentAt: e.sentAt,
      openedAt: e.openedAt,
      clickedAt: e.clickedAt,
      converted: e.convertedAt ? "Converted" : ""
    }));
  }

  async exportConverted(user, campaignId) {
    await this.verifyManagerControlsCampaign(user, campaignId);
    const whereClause = { callOutcome: 'Converted' };
    if (campaignId) whereClause.campaignId = campaignId;

    const conversions = await CallRemark.findAll({
      where: whereClause,
      include: [{
        model: ClientLead, as: 'clientLead',
        include: [{ model: MasterContact, as: 'masterContact' }]
      }],
      order: [['createdAt', 'DESC']],
      raw: true,
      nest: true
    });

    return conversions.map(c => ({
      campaignId: c.campaignId,
      executiveId: c.executiveUserId,
      contactEmail: c.clientLead.masterContact.email,
      contactPhone: c.clientLead.masterContact.phone,
      firstName: c.clientLead.masterContact.firstName,
      lastName: c.clientLead.masterContact.lastName,
      jobTitle: c.clientLead.masterContact.jobTitle,
      company: c.clientLead.masterContact.company,
      callDuration: c.callDurationMinutes,
      notes: c.notes,
      conversionDate: c.createdAt
    }));
  }
}
module.exports = ReportService;

