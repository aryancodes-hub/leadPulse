const {
  Campaign,
  CampaignLead,
  LeadListMembership,
  ClientManager,
  CampaignExecutive,
  EmailProcessingJob,
  LeadEngagement,
  Client,
  User,
  ClientLead,
  MasterContact,
  Sequence,
  CallRemark,
  sequelize
} = require("leadpulse-data-model");
const { ForbiddenError, NotFoundError, BadRequestError } = require("../../lib/error");
const { Op } = require("sequelize");

class CampaignService {
  // 1. Updated verifyClientAccess
  async verifyClientAccess(userId, clientId, userRole) {
    if (userRole === "client") {
      const user = await User.findByPk(userId, { attributes: ["clientId"] });
      if (!user || user.clientId !== clientId)
        throw new ForbiddenError("You do not have access to this client's data.");
      return;
    }

    // Fallback to manager logic if role is campaign_manager (or undefined in older routes)
    const link = await ClientManager.findOne({ where: { userId, clientId } });
    if (!link) throw new ForbiddenError("You do not manage this client.");
  }

  // 2. Updated getCampaign to pass the role
  async getCampaign(userId, id, role) {
    const campaign = await Campaign.findOne({
      where: { id },
      include: [{ model: Sequence, as: "sequence" }]
    });
    if (!campaign) throw new NotFoundError("Campaign not found");

    // 🚀 Pass the role so the updated verification works!
    await this.verifyClientAccess(userId, campaign.clientId, role);

    const convertedCount = await CallRemark.count({
      where: { campaignId: id, callOutcome: "Converted" }
    });
    const cData = campaign.toJSON();

    return {
      sequenceName: cData.sequence?.name || "Unknown Sequence",
      campaign: {
        id: cData.id,
        name: cData.name,
        type: cData.type === "call" ? "Phone" : "Email",
        status: cData.status
          ? cData.status.charAt(0).toUpperCase() + cData.status.slice(1)
          : "Active",
        convertedLeads: convertedCount,
        totalDelivered: 0,
        targetAudience: cData.segmentationFilters
          ? JSON.stringify(cData.segmentationFilters)
          : "Enterprise B2B Decision Makers",
        schedule: cData.scheduleType || "Daily Automated Cadence",
        description:
          cData.description || `This ${cData.type} campaign was executed as part of the sequence.`
      }
    };
  }

  async createCampaign(userId, data) {
    await this.verifyClientAccess(userId, data.clientId);

    return await sequelize.transaction(async (t) => {
      data.createdByUserId = userId;
      const campaign = await Campaign.create(data, { transaction: t });

      let whereClause = { leadListId: data.leadListId };

      // 1. Sequence-Level Check
      if (campaign.excludeClosedLeads) {
        whereClause.status = { [Op.ne]: "Converted" };
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
        const campaignLeads = members.map((m) => ({
          campaignId: campaign.id,
          clientLeadId: m.clientLeadId,
          status: "pending"
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
      // 1. Specific client requested
      await this.verifyClientAccess(userId, clientId, role); // 🚀 Ensure role is passed
      whereClause.clientId = clientId;
    } else if (role === "campaign_manager") {
      // 2. Manager view
      const links = await ClientManager.findAll({ where: { userId } });
      if (links.length === 0) {
        return { campaigns: [], total: 0 };
      }
      const clientIds = links.map((link) => link.clientId);
      whereClause.clientId = { [Op.in]: clientIds };
    } else {
      throw new BadRequestError("clientId query parameter is required");
    }

    const { count, rows } = await Campaign.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      include: [
        { model: Client, as: "client", attributes: ["name"] },
        {
          model: CampaignExecutive,
          as: "executives",
          attributes: ["unassignedAt", "createdAt"],
          where: { isActive: true },
          required: false,
          include: [
            {
              model: User,
              as: "executive",
              attributes: ["id", "fullName", "email", "isActive"]
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    // 🚀 NEW: Reshape data here instead of the controller!
    const formattedCampaigns = rows.map((c) => {
      const cData = c.toJSON ? c.toJSON() : c;
      const status = cData.status ? cData.status.charAt(0).toUpperCase() + cData.status.slice(1) : "Draft";
      const type = cData.type === "call" ? "Cold Call Blitz" : cData.type === "email" ? "Email Sequence Drip" : cData.type;

      return {
        id: cData.id,
        name: cData.name, 
        clientName: cData.client?.name || cData.clientId, 
        type: type,
        status: status,
        executives: (cData.executives || []).map((ex) => ({
          id: ex.executive?.id,
          name: ex.executive?.fullName,
          email: ex.executive?.email,
          status: ex.executive?.isActive ? "Active" : "Inactive",
          assignedat: ex.createdAt,
          unassignedat: ex.unassignedAt
        }))
      };
    });

    return { campaigns: formattedCampaigns, total: count };
  }
  async updateCampaign(userId, id, data) {
    const campaign = await Campaign.findOne({ where: { id } });
    if (!campaign) throw new Error("Campaign not found");
    if (campaign.status !== "draft") {
      throw new Error("Only draft campaigns can be edited");
    }
    await campaign.update(data);
    return campaign;
  }

  async updateStatus(userId, id, newStatus) {
    const campaign = await Campaign.findOne({ where: { id } });
    if (!campaign) throw new NotFoundError("Campaign not found");

    const validStatuses = ["active", "paused", "draft", "completed"];
    const targetStatus = newStatus.toLowerCase();

    if (!validStatuses.includes(targetStatus)) {
      throw new BadRequestError("Invalid status update");
    }

    campaign.status = targetStatus;
    await campaign.save();

    // --- NEW LOGIC: If marked completed, deactivate all executives ---
    if (targetStatus === "completed") {
      await CampaignExecutive.update({ isActive: false }, { where: { campaignId: id } });
    }

    return campaign;
  }

  async deleteCampaign(userId, id) {
    const campaign = await Campaign.findOne({ where: { id } });
    if (!campaign) throw new NotFoundError("Campaign not found");
    if (campaign.status !== "draft") {
      throw new BadRequestError("Only draft campaigns can be deleted");
    }
      
    await campaign.destroy();
    return true;
  }

  async approveCampaign(userId, id) {
    const campaign = await Campaign.findOne({ where: { id } });
    if (!campaign) throw new NotFoundError("Campaign not found");
    if (campaign.status !== "draft") {
      throw new BadRequestError("Only draft campaigns can be approved");
    }
    if (campaign.type === "call") {
      const execCount = await CampaignExecutive.count({
        where: { campaignId: id, isActive: true }
      });
      if (execCount === 0) {
        throw new BadRequestError(
          "Cannot approve a Call Campaign without assigning at least one executive."
        );
      }
    }
    await campaign.update({
      approvedByUserId: userId,
      approvedAt: new Date(),
      status: "active"
    });
    return campaign;
  }

  async getEmailDashboard(userId, campaignId) {
    // 1. Fetch Basic Campaign Details
    const campaign = await Campaign.findOne({
      where: { id: campaignId },
      attributes: ["id", "name", "status", "type", "dispatchStatus"],
      include: [
        {
          model: Client,
          as: "client",
          attributes: ["name"]
        }
      ]
    });

    if (!campaign) throw new Error("Campaign not found");

    // 2. Fetch Job Details (Grab the most recent processing job)
    const job = await EmailProcessingJob.findOne({
      where: { campaignId },
      order: [["createdAt", "DESC"]]
    });

    // 3. Fetch Engagement Logs with Recipient Data
    const engagements = await LeadEngagement.findAll({
      where: { campaignId },
      include: [
        {
          model: ClientLead,
          as: "clientLead",
          include: [
            {
              model: MasterContact,
              as: "masterContact",
              attributes: ["firstName", "lastName", "email"]
            }
          ]
        }
      ],
      order: [
        ["sentAt", "DESC NULLS LAST"],
        ["createdAt", "DESC"]
      ]
    });

    // 4. Flatten logs exactly how your frontend Analytics/Log UI expects it
    const formattedLogs = engagements.map((e) => ({
      id: e.id,
      firstName: e.clientLead?.masterContact?.firstName,
      lastName: e.clientLead?.masterContact?.lastName,
      email: e.clientLead?.masterContact?.email,
      status: e.status, // sent, delivered, bounced, spamreport
      opens: e.openCount || 0,
      clicks: e.clickCount || 0,
      sentAt: e.sentAt
    }));

    // 5. Unified Payload
    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        clientName: campaign.client.name,
        status: campaign.status,
        dispatchStatus: campaign.dispatchStatus
      },
      job: job
        ? {
            status: job.status, // Queued, Processing, Completed, Failed
            totalEmails: job.totalEmails || 0,
            processedEmails: job.processedEmails || 0,
            successfulSends: job.successfulSends || 0,
            failedSends: job.failedSends || 0
          }
        : null,
      logs: formattedLogs
    };
  }

}
module.exports = CampaignService;
