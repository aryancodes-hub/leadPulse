const { Sequence, Campaign, ClientManager } = require('leadpulse-data-model');
const { ForbiddenError, NotFoundError } = require('../../lib/error');

class SequenceService {
  async verifyClientAccess(userId, clientId) {
    const link = await ClientManager.findOne({ where: { userId, clientId } });
    if (!link) throw new ForbiddenError("You do not manage this client.");
  }

  async createSequence(userId, data) {
    await this.verifyClientAccess(userId, data.clientId);
    return await Sequence.create(data);
  }

  async getSequences(userId, clientId, pagination) {
    await this.verifyClientAccess(userId, clientId);
    const { limit, offset } = pagination;
    const { count, rows } = await Sequence.findAndCountAll({
      where: { clientId },
      limit, offset,
      order: [['createdAt', 'DESC']]
    });
    return { sequences: rows, total: count };
  }

  async getSequenceById(userId, id) {
    const sequence = await Sequence.findByPk(id, {
      include: [{ model: Campaign, as: 'campaigns' }]
    });
    if (!sequence) throw new NotFoundError("Sequence not found");
    await this.verifyClientAccess(userId, sequence.clientId);
    return sequence;
  }
}

module.exports = SequenceService;
