const { ClientLead, MasterContact, ClientManager } = require('leadpulse-data-model');
const { NotFoundError, ForbiddenError } = require('../../lib/error');

class ClientLeadService {
  
  async verifyClientAccess(userId, clientId) {
    const link = await ClientManager.findOne({ where: { userId, clientId } });
    if (!link) {
      throw new ForbiddenError("You do not manage this client.");
    }
  }

  async getClientLeads(userId, clientId, pagination) {
    await this.verifyClientAccess(userId, clientId);
    const { limit, offset } = pagination;
    
    const { count, rows } = await ClientLead.findAndCountAll({
      where: { clientId },
      limit,
      offset,
      include: [{ model: MasterContact, as: 'masterContact' }],
      order: [['createdAt', 'DESC']]
    });

    return { leads: rows, total: count };
  }

  async updateCompliance(id, data) {
    // This is public/system route triggered by webhooks or unsubscribe links usually.
    // However, if accessed by API, we just update the specific record directly.
    const lead = await ClientLead.findByPk(id);
    if (!lead) throw new NotFoundError("Client lead not found");

    const updateData = {};
    if (data.isDnc !== undefined) updateData.isDnc = data.isDnc;
    if (data.isUnsubscribed !== undefined) updateData.isUnsubscribed = data.isUnsubscribed;

    await lead.update(updateData);
    return lead;
  }
}

module.exports = ClientLeadService;
