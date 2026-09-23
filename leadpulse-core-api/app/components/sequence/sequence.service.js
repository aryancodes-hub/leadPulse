const { Sequence, Campaign, LeadListMembership, ClientLead, MasterContact, ClientManager, CallRemark, User } = require("leadpulse-data-model");
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
    
    const campaignIds = sequences.flatMap(seq => (seq.campaigns || []).map(c => c.id));
    
    let conversionMap = {};
    let deliveryMap = {};

    if (campaignIds.length > 0) {
      const { Op } = require('sequelize');
      const { LeadEngagement } = require('leadpulse-data-model'); // Need to require Email table

      // 1. Call Conversions
      const callConversions = await CallRemark.findAll({
        where: { campaignId: campaignIds, callOutcome: 'Converted' },
        attributes: ['campaignId', [fn('COUNT', col('id')), 'total']],
        group: ['campaignId'],
        raw: true
      });
      callConversions.forEach(c => conversionMap[c.campaignId] = parseInt(c.total, 10));

      // 2. Email Conversions
      const emailConversions = await LeadEngagement.findAll({
        where: { campaignId: campaignIds, convertedAt: { [Op.not]: null } },
        attributes: ['campaignId', [fn('COUNT', col('id')), 'total']],
        group: ['campaignId'],
        raw: true
      });
      emailConversions.forEach(c => {
        conversionMap[c.campaignId] = (conversionMap[c.campaignId] || 0) + parseInt(c.total, 10);
      });

      // 3. Call Deliveries (Total Dials)
      const callTotals = await CallRemark.findAll({
        where: { campaignId: campaignIds },
        attributes: ['campaignId', [fn('COUNT', col('id')), 'total']],
        group: ['campaignId'],
        raw: true
      });
      callTotals.forEach(c => deliveryMap[c.campaignId] = parseInt(c.total, 10));

      // 4. Email Deliveries (Total Sent)
      const emailTotals = await LeadEngagement.findAll({
        where: { campaignId: campaignIds },
        attributes: ['campaignId', [fn('COUNT', col('id')), 'total']],
        group: ['campaignId'],
        raw: true
      });
      emailTotals.forEach(c => {
        deliveryMap[c.campaignId] = (deliveryMap[c.campaignId] || 0) + parseInt(c.total, 10);
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
          const totalDelivered = deliveryMap[camp.id] || 0; // 🚀 Use the dynamic map instead of 0
          
          return {
            id: camp.id,
            name: camp.name,
            type: camp.type === 'call' ? 'Phone' : 'Email',
            status: camp.status ? camp.status.charAt(0).toUpperCase() + camp.status.slice(1) : 'Active',
            convertedLeads: convertedLeads, 
            cost: camp.pricingModel === 'flat_retainer' 
               ? `$${Number(camp.retainerAmount || 0).toLocaleString()}` 
               : `$${Number((camp.ratePerLead || 0) * convertedLeads).toLocaleString()}`,
            totalDelivered: totalDelivered,
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

  async getSequenceConvertedLeads(userId, userRole, sequenceId) {
    
    const sequence = await Sequence.findByPk(sequenceId);
    if (!sequence) throw new NotFoundError("Sequence not found");

    // Re-use your existing security check
    await this.verifyClientAccess(userId, sequence.clientId, userRole);

    const memberships = await LeadListMembership.findAll({
      where: {
        leadListId: sequence.leadListId,
        status: 'Converted' // Only fetch leads that have successfully converted
      },
      include: [{
        model: ClientLead,
        as: 'clientLead',
        include: [{
          model: MasterContact,
          as: 'masterContact'
        }]
      }],
      order: [['updatedAt', 'DESC']]
    });

    // Format strictly for your frontend DeepDiveView table
    return memberships.map(m => {
      const contact = m.clientLead?.masterContact;
      return {
        id: m.clientLeadId,
        name: contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Lead',
        email: contact?.email || 'No email',
        phone: contact?.phone || 'No phone',
        company: contact?.company || 'Unknown Company',
        jobTitle: contact?.jobTitle || 'N/A',
        convertedDate: m.updatedAt.toLocaleDateString()
      };
    });
  }
}

module.exports = SequenceService;
