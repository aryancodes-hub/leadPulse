const { Campaign, CallRemark, LeadEngagement, CampaignLead, ClientManager, sequelize } = require('leadpulse-data-model');
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

    const totalCalls = await CallRemark.count({ where: { executiveUserId } });
    const conversions = await CallRemark.count({ where: { executiveUserId, callOutcome: 'Converted' } });
    
    const pendingQueue = await CampaignLead.count({ 
      where: { assignedExecutiveId: executiveUserId, status: 'pending' } 
    });

    return {
      executiveUserId,
      totalCalls,
      totalConversions: conversions,
      pendingQueueSize: pendingQueue,
      conversionRate: totalCalls > 0 ? ((conversions / totalCalls) * 100).toFixed(2) + '%' : '0%'
    };
  }

    async getClientPortalSummary(userId, userRole, targetClientId) {
      let clientId = targetClientId;

      if (userRole === 'campaign_manager') {
        const link = await ClientManager.findOne({ where: { userId, clientId } });
        if (!link) throw new ForbiddenError("You do not manage this client.");
      }

      const campaignStats = await Campaign.findAll({
        where: { clientId },
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true
      });

      let activeCampaigns = 0;
      let completedCampaigns = 0;
      let totalCampaigns = 0;
      
      campaignStats.forEach(stat => {
        const count = parseInt(stat.count, 10);
        totalCampaigns += count;
        if (stat.status === 'active') activeCampaigns += count;
        if (stat.status === 'completed') completedCampaigns += count;
      });

      const { LeadListMembership, LeadList } = require('leadpulse-data-model');
      const totalConversion = await LeadListMembership.count({
        include: [{ model: LeadList, as: 'leadList', where: { clientId } }],
        where: { status: 'Converted' }
      });
      const totalLeads = await LeadListMembership.count({
        include: [{ model: LeadList, as: 'leadList', where: { clientId } }]
      });
      const conversionRate = totalLeads > 0 ? ((totalConversion / totalLeads) * 100).toFixed(1) : "0.0";
      const totalCalls = await CallRemark.count({
        include: [{ model: Campaign, as: 'campaign', where: { clientId }, attributes: [] }]
      });
      const totalEmails = await LeadEngagement.count({
        include: [{ model: Campaign, as: 'campaign', where: { clientId }, attributes: [] }]
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