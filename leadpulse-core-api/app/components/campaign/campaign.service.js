const { Campaign, CampaignLead, LeadListMembership, LeadList, ClientManager, CampaignExecutive, sequelize } = require('leadpulse-data-model');
const { ForbiddenError, NotFoundError, BadRequestError } = require('../../lib/error');
const { Op } = require('sequelize');

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
      
      let whereClause = { leadListId: data.leadListId };

      // 1. Sequence-Level Check
      if (campaign.excludeClosedLeads) {
        whereClause.status = { [Op.ne]: 'Converted' };
      }

      // 2. Global Client-Level Check
      if (campaign.requiresNetNewLeads) {
        whereClause.clientLeadId = {
          [Op.notIn]: sequelize.literal(`(
            SELECT client_lead_id 
            FROM lead_list_memberships 
            WHERE status = 'Converted'
          )`)
        };
      }

      const members = await LeadListMembership.findAll({
        where: whereClause,
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

  async getCampaigns(userId, clientId, pagination, role) {
    const { limit, offset } = pagination;
    let whereClause = {};

    if (clientId) {
      // 1. Specific client requested (original behavior)
      await this.verifyClientAccess(userId, clientId);
      whereClause.clientId = clientId;
    } else if (role === 'campaign_manager') {
      // 2. No client requested, but user is a manager (new frontend requirement)
      const links = await ClientManager.findAll({ where: { userId } });
      if (links.length === 0) {
        return { campaigns: [], total: 0 }; // Manager has no clients yet
      }
      const clientIds = links.map(link => link.clientId);
      whereClause.clientId = { [Op.in]: clientIds };
    } else {
      // 3. Fallback security block
      throw new BadRequestError("clientId query parameter is required");
    }

    const { count, rows } = await Campaign.findAndCountAll({
      where: whereClause,
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
    
    // Update the campaign status
    await campaign.update({ status });

    // --- NEW LOGIC: If marked completed, deactivate all executives ---
    if (status === 'completed') {
      await CampaignExecutive.update(
        { isActive: false },
        { where: { campaignId: id } }
      );
    }
    // ---------------------------------------------------------------

    return campaign;
  }

    async approveCampaign(userId, id) {
    const campaign = await this.getCampaign(userId, id);
    if (campaign.status !== 'draft') throw new BadRequestError("Only draft campaigns can be approved");

    // NEW: Enforce executive assignment for Call Campaigns
    if (campaign.type === 'call') {
      const execCount = await CampaignExecutive.count({
        where: { campaignId: id, isActive: true }
      });
      if (execCount === 0) {
        throw new BadRequestError("Cannot approve a Call Campaign without assigning at least one executive.");
      }
    }

    await campaign.update({ 
      approvedByUserId: userId,
      approvedAt: new Date(),
      status: 'active'
    });
    return campaign;
  }
}
module.exports = CampaignService;


