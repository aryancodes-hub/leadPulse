const { CampaignExecutive, CampaignLead, User, Campaign, ClientManager, sequelize } = require('leadpulse-data-model');
const { ForbiddenError, NotFoundError, BadRequestError } = require('../../lib/error');
const { Op } = require('sequelize');

class TeamExecutionService {
  async verifyManagerControlsCampaign(userId, campaignId) {
    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) throw new NotFoundError("Campaign not found");
    
    // Security Check: Ensure this user actually manages the client who owns the campaign
    const link = await ClientManager.findOne({ 
      where: { userId, clientId: campaign.clientId } 
    });
    
    if (!link) {
      throw new ForbiddenError("You do not have permission to manage this campaign.");
    }

    return campaign;
  }

  async getExecutives(campaignId) {
    return await CampaignExecutive.findAll({
      where: { campaignId, isActive: true },
      include: [{ model: User, as: 'executive', attributes: ['id', 'fullName', 'email'] }]
    });
  }

  async addExecutive(managerId, campaignId, executiveUserId) {
    await this.verifyManagerControlsCampaign(managerId, campaignId);
    const exec = await User.findOne({ where: { id: executiveUserId, role: 'executive' } });
    if (!exec) throw new BadRequestError("Valid executive user required");

    // Enforce business rule: Executive can only be active on ONE campaign at a time
    const existingAssignment = await CampaignExecutive.findOne({
      where: {
        executiveUserId,
        isActive: true,
        campaignId: { [Op.ne]: campaignId }
      }
    });

    if (existingAssignment) {
      throw new BadRequestError("This Executive is currently active on another campaign. You must unassign them from their current campaign before assigning them to a new one.");
    }

    const [assignment] = await CampaignExecutive.findOrCreate({
      where: { campaignId, executiveUserId },
      defaults: { isActive: true }
    });
    
    if (!assignment.isActive) {
      await assignment.update({ isActive: true, unassignedAt: null });
    }
    return assignment;
  }

  async removeExecutive(managerId, campaignId, executiveUserId, reassignToUserId = null) {
    await this.verifyManagerControlsCampaign(managerId, campaignId);
    
    // If targeted reassignment, ensure target is an active executive on this campaign
    if (reassignToUserId) {
      const newExecAssignment = await CampaignExecutive.findOne({ 
        where: { campaignId, executiveUserId: reassignToUserId, isActive: true } 
      });
      if (!newExecAssignment) {
        throw new BadRequestError("The target executive for reassignment must be an active executive on this campaign first.");
      }
    }

    const assignment = await CampaignExecutive.findOne({ where: { campaignId, executiveUserId, isActive: true } });
    if (!assignment) throw new NotFoundError("Active executive assignment not found");
    
    await assignment.update({ isActive: false, unassignedAt: new Date() });
    
    // Transfer or Unassign pending leads
    await CampaignLead.update(
      { assignedExecutiveId: reassignToUserId },
      { where: { campaignId, assignedExecutiveId: executiveUserId, status: 'pending' } }
    );
    
    return true;
  }

  async assignLeadsRoundRobin(managerId, campaignId) {
    await this.verifyManagerControlsCampaign(managerId, campaignId);
    
    const activeExecs = await CampaignExecutive.findAll({
      where: { campaignId, isActive: true },
      order: [['createdAt', 'ASC']]
    });
    if (activeExecs.length === 0) throw new BadRequestError("No active executives on this campaign");
    
    const pendingLeads = await CampaignLead.findAll({
      where: { campaignId, assignedExecutiveId: null, status: 'pending' },
      order: [['createdAt', 'ASC']]
    });

    if (pendingLeads.length === 0) return { assignedCount: 0 };

    let execIndex = 0;
    const now = new Date();
    
    return await sequelize.transaction(async (t) => {
      let assignedCount = 0;
      for (const lead of pendingLeads) {
        const exec = activeExecs[execIndex];
        await lead.update({ assignedExecutiveId: exec.executiveUserId, assignedAt: now }, { transaction: t });
        execIndex = (execIndex + 1) % activeExecs.length;
        assignedCount++;
      }
      return { assignedCount };
    });
  }
}
module.exports = TeamExecutionService;
