const SequenceService = require('./sequence.service');
const { sendSuccess } = require('../../utils/response-wrapper');

class SequenceController {
  constructor() {
    this.sequenceService = new SequenceService();
  }

  async createSequence(req, res, next) {
    try {
      const sequence = await this.sequenceService.createSequence(req.user.id, req.body);
      return sendSuccess(res, sequence, 'Sequence created successfully', null, 201);
    } catch (error) { next(error); }
  }

  async getSequences(req, res, next) {
    try {
      const clientId = req.user.role === 'client' ? req.user.clientId : req.query.clientId;
      if (!clientId) throw new Error('clientId query parameter is required');
      const pagination = req.pagination || { limit: 50, offset: 0, page: 1, pageSize: 50 };
      const { sequences, total } = await this.sequenceService.getSequences(req.user.id, clientId, pagination, req.user.role);
      // Reshape the data to match the DeepDiveView JSON expectations exactly
      const formattedSequences = sequences.map(seq => {
         const seqJSON = seq.toJSON ? seq.toJSON() : seq;
         return {
           id: seqJSON.id,
           name: seqJSON.name,
           description: seqJSON.description,
           campaigns: (seqJSON.campaigns || []).map(camp => ({
             id: camp.id,
             name: camp.name,
             type: camp.type === 'call' ? 'Phone' : 'Email',
             status: camp.status ? camp.status.charAt(0).toUpperCase() + camp.status.slice(1) : 'Active',
             convertedLeads: camp.convertedLeads || 0, 
             cost: camp.pricingModel === 'flat_retainer' 
                ? `$${Number(camp.retainerAmount || 0).toLocaleString()}` 
                : `$${Number((camp.ratePerLead || 0) * (camp.convertedLeads || 0)).toLocaleString()}`,
             totalDelivered: 0,
             targetAudience: "Enterprise B2B Decision Makers",
             schedule: camp.scheduleType || 'Daily Automated',
             description: camp.description
           }))
         };
      });
      // Pass formattedSequences (array) so frontend `Array.isArray()` checks pass
      const meta = { total, page: pagination.page, pageSize: pagination.pageSize, totalPages: Math.ceil(total / pagination.pageSize) };
      return sendSuccess(res, formattedSequences, 'Sequences retrieved successfully', meta);
    } catch (error) { next(error); }
  }

  async getSequenceById(req, res, next) {
    try {
      const sequence = await this.sequenceService.getSequenceById(req.user.id, req.params.id, req.user.role);
      return sendSuccess(res, sequence, 'Sequence retrieved successfully');
    } catch (error) { next(error); }
  }
}
module.exports = SequenceController;

/**
 * @swagger
 * tags:
 *   name: Sequences
 *   description: Campaign sequencing and blueprint logic
 * 
 * /api/v1/sequences:
 *   get:
 *     tags: [Sequences]
 *     summary: Get all sequences
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     responses:
 *       200:
 *         description: List of sequences
 *   post:
 *     tags: [Sequences]
 *     summary: Create a new sequence
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, leadListId, name]
 *             properties:
 *               clientId:
 *                 type: string
 *                 format: uuid
 *               leadListId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sequence created
 * 
 * /api/v1/sequences/{id}:
 *   get:
 *     tags: [Sequences]
 *     summary: Get sequence by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Sequence details
 */
