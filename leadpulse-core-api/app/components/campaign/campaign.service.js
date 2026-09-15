const { Campaign, CampaignLead, LeadListMembership, ClientManager, sequelize } = require('leadpulse-data-model');
const { ForbiddenError, NotFoundError, BadRequestError } = require('../../lib/error');

class CampaignService {
  async verifyClientAccess(userId, clientId) {
    const link = await ClientManager.findOne({ where: { userId, clientId } });
    if (!link) throw new ForbiddenError("You do not manage this client.");
  }

  async getCampaign(userId, id) {
    const campaign = await Campaign.findByPk(id);
    if (!campaign) throw new NotFoundError("Campaign not found");
    await this.verifyClientAccess(userId, campaign.clientId);
    return campaign;
  }

  async createCampaign(userId, data) {
    await this.verifyClientAccess(userId, data.clientId);
    
    return await sequelize.transaction(async (t) => {
      data.createdByUserId = userId;
      const campaign = await Campaign.create(data, { transaction: t });
      
      // Synchronous Audience Building MVP: Copy members from LeadList to CampaignLead
      const members = await LeadListMembership.findAll({
        where: { leadListId: data.leadListId },
        transaction: t
      });

      if (members.length > 0) {
        const campaignLeads = members.map(m => ({
          campaignId: campaign.id,
          clientLeadId: m.clientLeadId,
          status: 'pending'
        }));
        await CampaignLead.bulkCreate(campaignLeads, { transaction: t, ignoreDuplicates: true });
      }

      return campaign;
    });
  }

  async getCampaigns(userId, clientId, pagination) {
    await this.verifyClientAccess(userId, clientId);
    const { limit, offset } = pagination;
    const { count, rows } = await Campaign.findAndCountAll({
      where: { clientId },
      limit, offset,
      order: [['createdAt', 'DESC']]
    });
    return { campaigns: rows, total: count };
  }

  async updateCampaign(userId, id, data) {
    const campaign = await this.getCampaign(userId, id);
    if (campaign.status !== 'draft') throw new BadRequestError("Only draft campaigns can be edited");
    await campaign.update(data);
    return campaign;
  }

  async deleteCampaign(userId, id) {
    const campaign = await this.getCampaign(userId, id);
    if (campaign.status !== 'draft') throw new BadRequestError("Only draft campaigns can be deleted");
    await campaign.destroy();
    return true;
  }

  async updateStatus(userId, id, status) {
    const campaign = await this.getCampaign(userId, id);
    await campaign.update({ status });
    return campaign;
  }

  async approveCampaign(userId, id) {
    const campaign = await this.getCampaign(userId, id);
    if (campaign.status !== 'draft') throw new BadRequestError("Only draft campaigns can be approved");
    await campaign.update({ 
      approvedByUserId: userId,
      approvedAt: new Date(),
      status: 'active'
    });
    return campaign;
  }
}
module.exports = CampaignService;

