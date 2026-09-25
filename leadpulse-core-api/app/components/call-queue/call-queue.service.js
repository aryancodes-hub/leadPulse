const {
  CampaignLead,
  CallRemark,
  ClientLead,
  LeadListMembership,
  MasterContact,
  Campaign,
  ClientManager,
  CampaignExecutive,
  sequelize
} = require("leadpulse-data-model");
const { Op } = require("sequelize");
const { NotFoundError, BadRequestError, ForbiddenError } = require("../../lib/error");

class CallQueueService {
  async getNextLead(executiveId, campaignId) {
    let nextLead = await CampaignLead.findOne({
      where: { campaignId, assignedExecutiveId: executiveId, status: "in_progress" },
      include: [
        {
          model: ClientLead,
          as: "clientLead",
          include: [{ model: MasterContact, as: "masterContact" }]
        }
      ],
      order: [["statusUpdatedAt", "DESC"]]
    });

    if (!nextLead) {
      nextLead = await CampaignLead.findOne({
        where: { campaignId, assignedExecutiveId: executiveId, status: "pending" },
        include: [{
          model: ClientLead, as: "clientLead",
          include: [{ model: MasterContact, as: "masterContact" }]
        }],
        order: [["assignedAt", "ASC"]]
      });
    }

    if (!nextLead) {
      nextLead = await CampaignLead.findOne({
        where: { campaignId, assignedExecutiveId: executiveId, status: "skipped" },
        include: [{
          model: ClientLead, as: "clientLead",
          include: [{ model: MasterContact, as: "masterContact" }]
        }],
        // Order by oldest skipped first
        order: [["statusUpdatedAt", "ASC"]]
      });
    }
    if (nextLead && nextLead.status !== "in_progress") {
      await nextLead.update({ status: "in_progress", statusUpdatedAt: new Date() });
    }
    return nextLead || null;
  }

  async skipLead(executiveId, campaignId, leadId) {
    const lead = await CampaignLead.findOne({
      where: {
        campaignId,
        clientLeadId: leadId,
        assignedExecutiveId: executiveId,
        status: "in_progress"
      }
    });
    if (!lead) throw new NotFoundError("Lead not found or not in progress by this executive");

    await lead.update({ status: "skipped", statusUpdatedAt: new Date() });
    return lead;
  }

  async createCallRemark(executiveId, data) {
    const { campaignId, clientLeadId, callOutcome, leadStatusUpdate } = data;

    // Security Check: Executive must be active on this campaign
    const execLink = await CampaignExecutive.findOne({
      where: { campaignId, executiveUserId: executiveId, isActive: true }
    });
    if (!execLink) throw new ForbiddenError("You are not actively assigned to this campaign.");

    return await sequelize.transaction(async (t) => {
      const remark = await CallRemark.create(
        {
          ...data,
          executiveUserId: executiveId,
          isManualEntryByManager: false
        },
        { transaction: t }
      );

      let newQueueStatus = "called";
      if (callOutcome === "Converted") newQueueStatus = "completed";
      if (["Busy", "Not_Answered"].includes(callOutcome)) newQueueStatus = "pending";

      await CampaignLead.update(
        { status: newQueueStatus, statusUpdatedAt: new Date() },
        { where: { campaignId, clientLeadId }, transaction: t }
      );

      const campaign = await Campaign.findByPk(campaignId, { transaction: t });

      // 🚀 Auto-update the master list for everything EXCEPT "Converted"
      let mappedMembershipStatus = null; 

      if (callOutcome === 'Converted' || leadStatusUpdate === 'Converted') {
        // DO NOTHING! Leave it strictly for the QA Manager to confirm
        mappedMembershipStatus = null;
      } else if (leadStatusUpdate === 'Dead' || callOutcome === 'Not_Interested') {
        mappedMembershipStatus = 'Dead';
      } else if (['Callback Requested', 'Callback_Requested'].includes(callOutcome)) {
        mappedMembershipStatus = 'Callback';
      } else if (['Wrong Number', 'Not Answered', 'Left Voicemail', 'Wrong_Number', 'Not_Answered', 'Left_Voicemail'].includes(callOutcome)) {
        mappedMembershipStatus = 'Unreachable';
      }

      // If we have an auto-approved status, push it directly to the master table
      if (mappedMembershipStatus) {
        await LeadListMembership.update(
          { status: mappedMembershipStatus },
          { where: { clientLeadId, leadListId: campaign.leadListId }, transaction: t }
        );
      }

      // --- Check if campaign is completely out of leads ---
      const remainingLeads = await CampaignLead.count({
        where: {
          campaignId,
          status: { [Op.in]: ["pending", "in_progress", "skipped"] }
        },
        transaction: t
      });
      if (remainingLeads === 0) {
        await campaign.update({ status: "completed" }, { transaction: t });
        await CampaignExecutive.update(
          { isActive: false },
          { where: { campaignId }, transaction: t }
        );
      }

      return remark;
    });
  }

  async verifyManagerControlsCampaign(userId, campaignId) {
    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) throw new NotFoundError("Campaign not found");
    const link = await ClientManager.findOne({ where: { userId, clientId: campaign.clientId } });
    if (!link) throw new ForbiddenError("You do not have permission to manage this campaign.");
    return campaign;
  }

  async getCallRemarks(managerId, campaignId, pagination) {
    await this.verifyManagerControlsCampaign(managerId, campaignId);

    const { limit, offset } = pagination;
    const { count, rows } = await CallRemark.findAndCountAll({
      where: { campaignId },
      limit,
      offset,
      order: [["createdAt", "DESC"]]
    });
    return { remarks: rows, total: count };
  }

    async confirmConversion(managerId, remarkId, conversionConfirmed) {
    // 🚀 FIX: We added "leadListId" to the attributes so we can target the master table
    const remark = await CallRemark.findByPk(remarkId, {
      include: [{ model: Campaign, as: "campaign", attributes: ["id", "clientId", "leadListId"] }]
    });

    if (!remark) throw new NotFoundError("Call remark not found");

    // Security Check
    const link = await ClientManager.findOne({
      where: { userId: managerId, clientId: remark.campaign.clientId }
    });

    if (!link) {
      throw new ForbiddenError(
        "You do not have permission to confirm conversions for this client."
      );
    }

    if (remark.conversionConfirmed === true && conversionConfirmed === true) {
      return { remark, alreadyConfirmed: true };
    }

    // 🚀 FIX: Wrapped in a transaction to update both tables synchronously
    await sequelize.transaction(async (t) => {
      
      // 1. Update the CallRemark audit log
      await remark.update({
        conversionConfirmed,
        confirmedByUserId: managerId,
        confirmedAt: new Date()
      }, { transaction: t });

      // 2. The Official QA Action -> Update the Master Table
      let finalMasterStatus;
      if (conversionConfirmed === true) {
        finalMasterStatus = 'Converted';
      } else {
        // Based on your rule: If a manager rejects the claim, the lead backed out. Mark as Dead.
        finalMasterStatus = 'Dead';
      }

      await LeadListMembership.update(
        { status: finalMasterStatus },
        { 
          where: { 
            clientLeadId: remark.clientLeadId, 
            leadListId: remark.campaign.leadListId 
          }, 
          transaction: t 
        }
      );
    });

    return { remark, alreadyConfirmed: false };
  }
}
module.exports = CallQueueService;
