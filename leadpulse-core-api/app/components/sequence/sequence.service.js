const { Sequence, Campaign, ClientManager  } = require('leadpulse-data-model');
const { ForbiddenError, NotFoundError } = require('../../lib/error');

class SequenceService {
  async verifyClientAccess(userId, clientId, userRole) {
    if (userRole === 'client') return; // Clients inherently have access to their own clientId
    const link = await ClientManager.findOne({ where: { userId, clientId } });
    if (!link) throw new ForbiddenError("You do not manage this client.");
  }

  async createSequence(userId, data) {
    await this.verifyClientAccess(userId, data.clientId);
    return await Sequence.create(data);
  }

  async getSequences(userId, clientId, pagination, userRole) {
    await this.verifyClientAccess(userId, clientId, userRole);
    const { limit, offset } = pagination;
    const { count, rows } = await Sequence.findAndCountAll({
      where: { clientId },
      limit, offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: Campaign, as: 'campaigns' }] // MUST include campaigns for the frontend table
    });
    
    // Dynamically calculate converted leads per campaign
    const { CallRemark } = require('leadpulse-data-model');
    const sequences = rows.map(seq => seq.toJSON());
    for (const seq of sequences) {
      if (seq.campaigns) {
        for (const camp of seq.campaigns) {
          camp.convertedLeads = await CallRemark.count({ 
            where: { campaignId: camp.id, callOutcome: 'Converted' } 
          });
        }
      }
    }
    return { sequences, total: count };
  }

  async getSequenceById(userId, id, userRole) {
    const { Campaign, LeadListMembership, ClientLead } = require('leadpulse-data-model');
    const sequence = await Sequence.findByPk(id, {
      include: [{ model: Campaign, as: 'campaigns' }]
    });
    if (!sequence) throw new NotFoundError("Sequence not found");
    
    // Verify access AFTER fetching, so we know which client this belongs to
    await this.verifyClientAccess(userId, sequence.clientId, userRole);
    
    // Fetch converted leads
    const memberships = await LeadListMembership.findAll({
      where: { leadListId: sequence.leadListId, status: 'Converted' },
      include: [{ model: ClientLead, as: 'clientLead' }]
    });

    const leads = memberships.map(m => {
       const lead = m.clientLead || {};
       return {
         id: lead.id,
         name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown Lead',
         email: lead.email || '-',
         phone: lead.phone || '-',
         company: lead.companyName || '-',
         campaignName: 'Sequence Conversion', 
         convertedDate: m.updatedAt ? m.updatedAt.toISOString().split('T')[0] : 'N/A',
         status: 'Converted'
       };
    });

    const seqData = sequence.toJSON();
    seqData.leads = leads;
    
    return seqData;
  }
}

module.exports = SequenceService;
