const { LeadList, ImportJob, ClientManager, LeadListMembership, ClientLead, Sequence, MasterContact, sequelize } = require('leadpulse-data-model');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../../lib/error');
const storageService = require('../../utils/storage');

class LeadListService {

  async verifyClientAccess(userId, clientId) {
    const link = await ClientManager.findOne({ where: { userId, clientId } });
    if (!link) {
      throw new ForbiddenError("You do not manage this client.");
    }
  }

  async uploadList(userId, clientId, name, file) {
    if (!file) throw new BadRequestError("CSV file is required");
    await this.verifyClientAccess(userId, clientId);

    const s3SourceFileKey = await storageService.uploadFile(file, 'lead_import');

    return await sequelize.transaction(async (t) => {
      const leadList = await LeadList.create({
        clientId,
        name,
        importedByUserId: userId
      }, { transaction: t });

      const importJob = await ImportJob.create({
        clientId,
        leadListId: leadList.id,
        uploadedByUserId: userId,
        s3SourceFileKey,
        status: 'Uploaded'
      }, { transaction: t });

      return { leadList, importJob };
    });
  }

  async getImportStatus(userId, jobId) {
    const job = await ImportJob.findByPk(jobId, {
      include: [{ model: LeadList, as: 'leadList' }]
    });
    
    if (!job) throw new NotFoundError("Import job not found");
    await this.verifyClientAccess(userId, job.clientId);
    return job;
  }

  async getLeadLists(userId, clientId, pagination, role) {
    const { limit, offset } = pagination;
    let whereClause = {};

    if (clientId) {
      await this.verifyClientAccess(userId, clientId);
      whereClause.clientId = clientId;
    } else if (role === "campaign_manager") {
      const { ClientManager } = require('leadpulse-data-model');
      const { Op } = require('sequelize');
      const links = await ClientManager.findAll({ where: { userId } });
      if (links.length === 0) return { lists: [], total: 0 };
      whereClause.clientId = { [Op.in]: links.map(l => l.clientId) };
    } else {
      throw new Error("clientId query parameter is required");
    }
    
    const { count, rows } = await LeadList.findAndCountAll({
      where: whereClause,
       include: [
        { model: require('leadpulse-data-model').Client, as: 'client', attributes: ['name'] },
        { model: ImportJob, as: 'importJobs', separate: true, limit: 1, order: [['createdAt', 'DESC']] }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

     const listIds = rows.map(r => r.id);
    const { Sequence } = require('leadpulse-data-model');
    const sequences = await Sequence.findAll({ where: { leadListId: listIds } });

    const listsWithSequences = rows.map(list => {
      const l = list.toJSON();
      l.sequences = sequences.filter(s => s.leadListId === l.id);
      return l;
    });

    return { lists: listsWithSequences, total: count };
  }

  async getLeadListById(userId, id) {
    const list = await LeadList.findByPk(id, {
      include: [
        { model: ImportJob, as: 'importJobs', limit: 1, order: [['createdAt', 'DESC']] }
      ]
    });
    if (!list) throw new NotFoundError("Lead list not found");
    await this.verifyClientAccess(userId, list.clientId);
    return list;
  }

  async getListMembers(userId, listId, pagination) {
    const list = await this.getLeadListById(userId, listId); // verifies access implicitly
    const { limit, offset } = pagination;

    const { count, rows } = await LeadListMembership.findAndCountAll({
      where: { leadListId: listId },
      limit,
      offset,
      include: [{
        model: ClientLead,
        as: 'clientLead',
        include: [{ model: MasterContact, as: 'masterContact' }]
      }],
      order: [['addedAt', 'DESC']]
    });

    return { members: rows, total: count };
  }
}

module.exports = LeadListService;
