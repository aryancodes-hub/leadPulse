const { Campaign, CallRemark, LeadEngagement, CampaignLead, ClientManager, User, sequelize } = require('leadpulse-data-model');
const { Op } = require('sequelize');
const { ForbiddenError } = require('../../lib/error');

class DashboardService {
  async getManagerSummary(managerId) {
    // Managers can see metrics across campaigns they control.
    // For MVP, aggregate everything they have access to.
    const activeCampaignsCount = await Campaign.count({ where: { createdByUserId: managerId, status: 'active' } });
    
    // Total dials across their campaigns
    const totalDials = await CallRemark.count({
      include: [{ model: Campaign, as: 'campaign', where: { createdByUserId: managerId } }]
    });

    // Email open rate
    const engagements = await LeadEngagement.findAll({
      include: [{ model: Campaign, as: 'campaign', where: { createdByUserId: managerId }, attributes: [] }],
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('LeadEngagement.id')), 'totalSent'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN "open_count" > 0 THEN 1 ELSE 0 END')), 'totalOpened']
      ],
      raw: true
    });
    
    const sent = parseInt(engagements[0]?.totalSent || 0, 10);
    const opened = parseInt(engagements[0]?.totalOpened || 0, 10);
    const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(2) + '%' : '0%';

    // Front-end requirements
    const { User, Client } = require('leadpulse-data-model');
    const activeClientsCount = await ClientManager.count({ where: { userId: managerId } });
    const activeExecutivesCount = await User.count({ where: { managerId, role: 'executive', isActive: true } });

    // Group conversions by client in JS to avoid Sequelize grouping quirks
    const allConversions = await CallRemark.findAll({
      where: { callOutcome: 'Converted' },
      include: [{
        model: Campaign,
        as: 'campaign',
        where: { createdByUserId: managerId },
        include: [{ model: Client, as: 'client' }]
      }]
    });

    const clientCounts = {};
    for (const remark of allConversions) {
       const cName = remark.campaign?.client?.name || 'Unknown Client';
       clientCounts[cName] = (clientCounts[cName] || 0) + 1;
    }
    const conversionsByClient = Object.keys(clientCounts).map(name => ({
       clientName: name,
       conversions: clientCounts[name]
    }));

    return {
      activeCampaigns: activeCampaignsCount,
      activeClients: activeClientsCount,
      activeExecutives: activeExecutivesCount,
      conversionsByClient,
      totalDials,
      emailOpenRate: openRate
    };
  }

  async getExecPerformance(requesterId, requesterRole, targetExecutiveId) {
    // Target defaults to requester if they are an executive
    const executiveUserId = targetExecutiveId || requesterId;
    if (requesterRole === 'campaign_manager' && targetExecutiveId && targetExecutiveId !== requesterId) {
      const { User } = require('leadpulse-data-model');
      const execUser = await User.findOne({ where: { id: targetExecutiveId, managerId: requesterId } });
      if (!execUser) throw new ForbiddenError("You do not manage this executive.");
    }

    // Determine start of today for accurate daily tracking
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 1. Basic Metrics
    const totalCalls = await CallRemark.count({ where: { executiveUserId } });
    
    const pendingQueueSize = await CampaignLead.count({ 
      where: { assignedExecutiveId: executiveUserId, status: 'pending' } 
    });

    // 2. Performance Metrics
    const conversionsToday = await CallRemark.count({
      where: {
        executiveUserId,
        callOutcome: 'Converted',
        createdAt: { [Op.gte]: startOfDay }
      }
    });

    const disqualifiedCount = await CallRemark.count({
      where: { executiveUserId, callOutcome: 'Not Interested' }
    });

    // 3. Approval & Financial Tracking (In Review vs Confirmed)
    const inReviewCount = await CallRemark.count({
      where: { executiveUserId, callOutcome: 'Converted', confirmedByUserId: null }
    });

    const approvedCount = await CallRemark.count({
      where: { executiveUserId, callOutcome: 'Converted', confirmedByUserId: { [Op.not]: null } }
    });

    // Assume an average default rate of $50 per conversion if not strictly tied to a campaign rate
    const AVG_CONVERSION_RATE = 50;

    // 🚀 STRICT FRONTEND MAPPING: This perfectly matches the ExecutiveDashboardView.jsx expectations
    return {
      totalCalls,
      pendingQueueSize,
      conversionsToday,
      disqualifiedCount,
      inReviewCount,
      inReviewValue: inReviewCount * AVG_CONVERSION_RATE,
      confirmedEarnings: approvedCount * AVG_CONVERSION_RATE
    };
  }

  async getClientPortalSummary(userId, userRole, targetClientId) {
    let clientId = targetClientId;

    // Verify manager link if requested by manager
    if (userRole === 'campaign_manager') {
      const link = await ClientManager.findOne({ where: { userId, clientId } });
      if (!link) throw new ForbiddenError("You do not manage this client.");
    }

    const campaignStats = await Campaign.findAll({
      where: { clientId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const { LeadListMembership, LeadList } = require('leadpulse-data-model');
    
    // Deduplicated conversions based on unique client lead list memberships
    const totalConversions = await LeadListMembership.count({
      include: [{ model: LeadList, as: 'leadList', where: { clientId } }],
      where: { status: 'Converted' }
    });

    return {
      clientId,
      campaignsByStatus: campaignStats,
      totalConversions
    };
  }
}

module.exports = DashboardService;


