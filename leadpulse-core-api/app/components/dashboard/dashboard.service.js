const {
  Campaign,
  CallRemark,
  LeadEngagement,
  CampaignLead,
  ClientManager,
  CampaignExecutive,
  User,
  Client,
  ClientLead,
  MasterContact,
  sequelize
} = require("leadpulse-data-model");
const { Op } = require("sequelize");
const { ForbiddenError } = require("../../lib/error");

class DashboardService {
  async getManagerSummary(managerId) {
    const activeCampaignsCount = await Campaign.count({
      where: { createdByUserId: managerId, status: "active" }
    });

    const totalDials = await CallRemark.count({
      include: [{ model: Campaign, as: "campaign", where: { createdByUserId: managerId } }]
    });

    const engagements = await LeadEngagement.findAll({
      include: [
        { model: Campaign, as: "campaign", where: { createdByUserId: managerId }, attributes: [] }
      ],
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("LeadEngagement.id")), "totalSent"],
        [
          sequelize.fn("SUM", sequelize.literal('CASE WHEN "open_count" > 0 THEN 1 ELSE 0 END')),
          "totalOpened"
        ]
      ],
      raw: true
    });

    const sent = parseInt(engagements[0]?.totalSent || 0, 10);
    const opened = parseInt(engagements[0]?.totalOpened || 0, 10);
    const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(2) + "%" : "0%";

    const activeClientsCount = await ClientManager.count({ where: { userId: managerId } });
    const activeExecutivesCount = await User.count({
      where: { managerId, role: "executive", isActive: true }
    });

    // 🚀 NEW: Single query to the master table instead of scraping CallRemarks
    const convertedMemberships = await LeadListMembership.findAll({
      where: { status: "Converted" },
      include: [
        {
          model: LeadList,
          as: "leadList",
          required: true,
          include: [
            {
              model: Campaign,
              as: "campaigns",
              where: { createdByUserId: managerId },
              required: true,
              include: [{ model: Client, as: "client" }]
            }
          ]
        }
      ]
    });

    const clientCounts = {};
    for (const membership of convertedMemberships) {
      const campaigns = membership.leadList?.campaigns || [];
      if (campaigns.length > 0) {
        const cName = campaigns[0].client?.name || "Unknown Client";
        clientCounts[cName] = (clientCounts[cName] || 0) + 1;
      }
    }
    const conversionsByClient = Object.keys(clientCounts).map((name) => ({
      clientName: name,
      conversions: clientCounts[name]
    }));

    // 🚀 QA Table (Left exactly as is, it correctly grabs UNAPPROVED claims for the UI)
    const pendingData = await CallRemark.findAll({
      where: {
        callOutcome: "Converted",
        confirmedByUserId: null
      },
      include: [
        {
          model: Campaign,
          as: "campaign",
          where: { createdByUserId: managerId },
          include: [{ model: Client, as: "client" }]
        },
        { model: User, as: "executive" },
        {
          model: ClientLead,
          as: "clientLead",
          include: [{ model: MasterContact, as: "masterContact" }]
        }
      ],
      order: [["createdAt", "ASC"]] 
    });
    
    const pendingApprovals = pendingData.map((r) => ({
      id: r.id.substring(0, 8), 
      fullId: r.id, 
      execName: r.executive?.fullName || "Unknown Exec",
      leadName: r.clientLead?.masterContact
        ? `${r.clientLead.masterContact.firstName} ${r.clientLead.masterContact.lastName}`
        : "Unknown Lead",
      clientName: r.campaign?.client?.name || "Unknown Client",
      campaignName: r.campaign?.name || "Unknown Campaign",
      notes: r.notes || "No notes provided",
      duration: r.callDurationMinutes,
      outcome: r.callOutcome
    }));

    // 🚀 FIXED: Removed the duplicate keys from the return block!
    return {
      activeCampaigns: activeCampaignsCount,
      activeClients: activeClientsCount,
      activeExecutives: activeExecutivesCount,
      conversionsByClient,
      totalDials,
      emailOpenRate: openRate,
      pendingApprovals 
    };
  }

  async getExecPerformance(requesterId, requesterRole, targetExecutiveId) {
    // Target defaults to requester if they are an executive
    const executiveUserId = targetExecutiveId || requesterId;
    if (
      requesterRole === "campaign_manager" &&
      targetExecutiveId &&
      targetExecutiveId !== requesterId
    ) {
      const execUser = await User.findOne({
        where: { id: targetExecutiveId, managerId: requesterId }
      });
      if (!execUser) throw new ForbiddenError("You do not manage this executive.");
    }

    // Determine start of today for accurate daily tracking
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 1. Basic Metrics
    const totalCalls = await CallRemark.count({ where: { executiveUserId } });

    const pendingQueueSize = await CampaignLead.count({
      where: {
        assignedExecutiveId: executiveUserId,
        status: { [Op.in]: ["pending", "in_progress", "skipped"] }
      }
    });

    // 2. Performance Metrics
    const conversionsToday = await CallRemark.count({
      where: {
        executiveUserId,
        callOutcome: "Converted",
        createdAt: { [Op.gte]: startOfDay }
      }
    });

    const disqualifiedCount = await CallRemark.count({
      where: { executiveUserId, callOutcome: "Not Interested" }
    });

    // 3. Approval & Financial Tracking (In Review vs Confirmed)
    const inReviewCount = await CallRemark.count({
      where: { executiveUserId, callOutcome: "Converted", confirmedByUserId: null }
    });

    const approvedCount = await CallRemark.count({
      where: { executiveUserId, callOutcome: "Converted", confirmedByUserId: { [Op.not]: null } }
    });

    // Assume an average default rate of $50 per conversion if not strictly tied to a campaign rate
    const AVG_CONVERSION_RATE = 50;

    const executiveInfo = await User.findByPk(executiveUserId, {
      attributes: ["fullName", "email"]
    });

    const assignments = await CampaignExecutive.findAll({
      where: { executiveUserId, isActive: true },
      include: [
        { model: Campaign, as: "campaign", attributes: ["id", "name", "type", "description"] }
      ]
    });
    const activeCampaign = assignments.length > 0 ? assignments[0].campaign : null;

    // 1. Fetch recent general call history
    const recentCallLogs = await CallRemark.findAll({
      where: { executiveUserId },
      include: [
        {
          model: ClientLead,
          as: "clientLead",
          include: [{ model: MasterContact, as: "masterContact" }]
        }
      ],
      order: [["createdAt", "DESC"]],
      limit: 100
    });

    // 2. 🚀 Fetch ALL Scheduled Callbacks (ignores the 100 limit so they never disappear)
    const scheduledCallbacks = await CallRemark.findAll({
      where: {
        executiveUserId,
        callOutcome: "Callback Requested"
      },
      include: [
        {
          model: ClientLead,
          as: "clientLead",
          include: [{ model: MasterContact, as: "masterContact" }]
        }
      ],
      // Sort these by the follow-up date so the closest ones appear first!
      order: [["followUpDate", "ASC"]]
    });

    // 3. Merge them and remove duplicates (in case a callback was made in the last 100 calls)
    const uniqueLogsMap = new Map();
    recentCallLogs.forEach((log) => uniqueLogsMap.set(log.id, log));
    scheduledCallbacks.forEach((log) => uniqueLogsMap.set(log.id, log));
    const mergedLogsData = Array.from(uniqueLogsMap.values());

    // 4. Map to frontend requirements
    const callLogs = mergedLogsData.map((row) => ({
      id: row.id,
      leadName: row.clientLead?.masterContact
        ? `${row.clientLead.masterContact.firstName} ${row.clientLead.masterContact.lastName}`
        : "Unknown Lead",
      company: row.clientLead?.masterContact?.company || "Unknown",
      phone: row.clientLead?.masterContact?.phone || "Unknown",
      outcome: row.callOutcome,
      duration: row.callDurationMinutes,
      timestamp: row.createdAt.toLocaleString(),
      followUpDate: row.followUpDate ? new Date(row.followUpDate).toLocaleDateString() : null,
      notes: row.notes,
      status: row.leadStatusUpdate || "Contacted"
    }));
    // STRICT FRONTEND MAPPING: This perfectly matches the ExecutiveDashboardView.jsx expectations
    return {
      totalCalls,
      pendingQueueSize,
      conversionsToday,
      disqualifiedCount,
      inReviewCount,
      inReviewValue: inReviewCount * AVG_CONVERSION_RATE,
      confirmedEarnings: approvedCount * AVG_CONVERSION_RATE,
      activeCampaign,
      executiveDetails: executiveInfo
        ? {
            fullName: executiveInfo.fullName,
            email: executiveInfo.email
          }
        : null,
      callLogs
    };
  }

  async getClientPortalSummary(userId, userRole, targetClientId) {
    let clientId = targetClientId;

    if (userRole === "campaign_manager") {
      const link = await ClientManager.findOne({ where: { userId, clientId } });
      if (!link) throw new ForbiddenError("You do not manage this client.");
    }

    const campaignStats = await Campaign.findAll({
      where: { clientId },
      attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
      group: ["status"],
      raw: true
    });

    let activeCampaigns = 0;
    let completedCampaigns = 0;
    let totalCampaigns = 0;

    campaignStats.forEach((stat) => {
      const count = parseInt(stat.count, 10);
      totalCampaigns += count;
      if (stat.status === "active") activeCampaigns += count;
      if (stat.status === "completed") completedCampaigns += count;
    });

    const { LeadListMembership, LeadList } = require("leadpulse-data-model");
    const totalConversion = await LeadListMembership.count({
      include: [{ model: LeadList, as: "leadList", where: { clientId } }],
      where: { status: "Converted" }
    });
    const totalLeads = await LeadListMembership.count({
      include: [{ model: LeadList, as: "leadList", where: { clientId } }]
    });
    const conversionRate =
      totalLeads > 0 ? ((totalConversion / totalLeads) * 100).toFixed(1) : "0.0";
    const totalCalls = await CallRemark.count({
      include: [{ model: Campaign, as: "campaign", where: { clientId }, attributes: [] }]
    });
    const totalEmails = await LeadEngagement.count({
      include: [{ model: Campaign, as: "campaign", where: { clientId }, attributes: [] }]
    });

    return {
      totalConversion,
      totalCost: 0, // Update this if you add billing logic later
      conversionRate,
      totalCalls,
      totalEmails,
      activeCampaigns,
      completedCampaigns,
      totalCampaigns
    };
  }
}

module.exports = DashboardService;
