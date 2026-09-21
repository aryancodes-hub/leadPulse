const { Sequence, Campaign, ClientManager, CallRemark, User } = require("leadpulse-data-model");
const { ForbiddenError, NotFoundError } = require('../../lib/error');

class SequenceService {
  async verifyClientAccess(userId, clientId, userRole='campaign_manager') {
    // 1. If the user is a client, check if the requested clientId matches their own profile
    if (userRole === 'client') {
      const user = await User.findByPk(userId, { attributes: ['clientId'] });
      
      if (!user || user.clientId !== clientId) {
        throw new ForbiddenError("You do not have access to this client's data.");
      }
      return; // Access granted
    }

    // 2. If the user is a manager, check the mapping table
    if (userRole === 'campaign_manager') {
      const link = await ClientManager.findOne({ where: { userId, clientId } });
      
      if (!link) {
        throw new ForbiddenError("You do not manage this client.");
      }
      return; // Access granted
    }

    // 3. Fallback security for any other role attempting to query client data
    throw new ForbiddenError("You do not have permission to view client data.");
  }

  async createSequence(userId, data) {
    await this.verifyClientAccess(userId, data.clientId);
    return await Sequence.create(data);
  }

  async getSequences(userId, clientId, pagination, userRole) {
    await this.verifyClientAccess(userId, clientId, userRole);
    const { limit, offset } = pagination; 
    
    const { fn, col } = require('sequelize');
    
    const { count, rows } = await Sequence.findAndCountAll({
      where: { clientId },
      limit, offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: Campaign, as: 'campaigns' }] 
    });
    
    const sequences = rows.map(seq => seq.toJSON());
    
    // 🚀 OPTIMIZATION: Extract all campaign IDs and do ONE aggregate query (NO N+1 loops!)
    const campaignIds = sequences.flatMap(seq => (seq.campaigns || []).map(c => c.id));
    
    let conversionMap = {};
    if (campaignIds.length > 0) {
      const conversions = await CallRemark.findAll({
        where: { campaignId: campaignIds, callOutcome: 'Converted' },
        attributes: ['campaignId', [fn('COUNT', col('id')), 'totalConversions']],
        group: ['campaignId'],
        raw: true
      });
      
      // Map it for O(1) lookup
      conversions.forEach(c => {
        conversionMap[c.campaignId] = parseInt(c.totalConversions, 10);
      });
    }

    // Format sequences exactly for the frontend DeepDiveView
    const formattedSequences = sequences.map(seq => {
      return {
        id: seq.id,
        name: seq.name,
        description: seq.description,
        campaigns: (seq.campaigns || []).map(camp => {
          
          const convertedLeads = conversionMap[camp.id] || 0;
          
          return {
            id: camp.id,
            name: camp.name,
            type: camp.type === 'call' ? 'Phone' : 'Email',
            status: camp.status ? camp.status.charAt(0).toUpperCase() + camp.status.slice(1) : 'Active',
            convertedLeads: convertedLeads, 
            cost: camp.pricingModel === 'flat_retainer' 
               ? `$${Number(camp.retainerAmount || 0).toLocaleString()}` 
               : `$${Number((camp.ratePerLead || 0) * convertedLeads).toLocaleString()}`,
            totalDelivered: 0,
            targetAudience: "Enterprise B2B Decision Makers",
            schedule: camp.scheduleType || 'Daily Automated',
            description: camp.description
          };
        })
      };
    });

    return { sequences: formattedSequences, total: count };
  }

  async getSequenceById(userId, id) {
    const sequence = await Sequence.findByPk(id, {
      include: [{ model: Campaign, as: 'campaigns' }]
    });
    if (!sequence) throw new NotFoundError("Sequence not found");
    
    // Verify access AFTER fetching, so we know which client this belongs to
    await this.verifyClientAccess(userId, sequence.clientId);
    return sequence;
  }
}

module.exports = SequenceService;
