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

    await this.verifyClientAccess(userId, campaign.clientId, role);

    let convertedCount = 0;
    let deliveredCount = 0;

    // Dynamically calculate metrics based on campaign type!
    if (campaign.type === "call") {
      convertedCount = await CallRemark.count({
        where: { campaignId: id, callOutcome: "Converted" }
      });
    } else {
      convertedCount = await LeadEngagement.count({
        where: { campaignId: id, convertedAt: { [Op.not]: null } }
      });
      deliveredCount = await LeadEngagement.count({
        where: { campaignId: id, status: { [Op.notIn]: ["sent", "bounced", "spamreport"] } }
      });
    }

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
        totalDelivered: deliveredCount,
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

      // This saves the Draft, including the sequenceId and leadListId!
      const campaign = await Campaign.create(data, { transaction: t });

      // We STOP here. No leads are copied into CampaignLeads yet.
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
      const status = cData.status
        ? cData.status.charAt(0).toUpperCase() + cData.status.slice(1)
        : "Draft";
      const type =
        cData.type === "call"
          ? "Cold Call Blitz"
          : cData.type === "email"
            ? "Email Sequence Drip"
            : cData.type;

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

    // 1. GATEKEEPER: Ensure the background import is totally finished
    const pendingImports = await ImportJob.count({
      where: { leadListId: campaign.leadListId, status: { [Op.in]: ["Uploaded", "Processing"] } }
    });
    if (pendingImports > 0) {
      throw new BadRequestError(
        "Cannot approve yet. The attached Lead List is still being processed in the background."
      );
    }

    const totalLeads = await LeadListMembership.count({
      where: { leadListId: campaign.leadListId }
    });
    if (totalLeads === 0) {
      throw new BadRequestError(
        "Cannot approve. The attached Lead List is empty (the import failed or the CSV had zero rows)."
      );
    }

    // 2. Executive Validation (For Call Campaigns)
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

    // 3. COPY THE LEADS! (This is the code we took out of createCampaign)
    return await sequelize.transaction(async (t) => {
      let whereClause = { leadListId: campaign.leadListId };

      // Sequence-Level Check
      if (campaign.excludeClosedLeads) {
        whereClause.status = { [Op.ne]: "Converted" };
      }

      // Global Client-Level Check
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

      // 4. Finally, activate the campaign!
      await campaign.update(
        {
          approvedByUserId: userId,
          approvedAt: new Date(),
          status: "active"
        },
        { transaction: t }
      );

      return campaign;
    });
  }
}
module.exports = CampaignService;
