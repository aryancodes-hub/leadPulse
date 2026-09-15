const { Campaign, CallRemark, LeadEngagement, ClientLead, MasterContact, sequelize } = require('leadpulse-data-model');
const { ForbiddenError, NotFoundError } = require('../../lib/error');

class ReportService {
  async getCampaignSummary(campaignId) {
    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) throw new NotFoundError("Campaign not found");

    const callOutcomes = await CallRemark.findAll({
      where: { campaignId },
      attributes: [
        'callOutcome',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['callOutcome'],
      raw: true
    });

    const emailStats = await LeadEngagement.findAll({
      where: { campaignId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    return {
      campaign: { id: campaign.id, name: campaign.name, type: campaign.type },
      callOutcomes,
      emailStats
    };
  }

  async exportEngagements(campaignId) {
    const whereClause = {};
    if (campaignId) whereClause.campaignId = campaignId;

    const engagements = await LeadEngagement.findAll({
      where: whereClause,
      include: [{
        model: ClientLead, as: 'clientLead',
        include: [{ model: MasterContact, as: 'masterContact', attributes: ['email', 'firstName', 'lastName'] }]
      }],
      attributes: ['trackingToken', 'status', 'openCount', 'clickCount', 'sentAt', 'openedAt', 'clickedAt'],
      order: [['createdAt', 'DESC']],
      raw: true,
      nest: true
    });

    // Flatten for CSV/ExcelJS
    return engagements.map(e => ({
      email: e.clientLead.masterContact.email,
      firstName: e.clientLead.masterContact.firstName,
      lastName: e.clientLead.masterContact.lastName,
      status: e.status,
      opens: e.openCount,
      clicks: e.clickCount,
      sentAt: e.sentAt,
      openedAt: e.openedAt,
      clickedAt: e.clickedAt
    }));
  }

  async exportConverted(campaignId) {
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

    // Flatten for Handoff
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
