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
      const clientId = req.query.clientId;
      if (!clientId) throw new Error('clientId query parameter is required');
      const { sequences, total } = await this.sequenceService.getSequences(req.user.id, clientId, req.pagination);
      const meta = { total, page: req.pagination.page, pageSize: req.pagination.pageSize, totalPages: Math.ceil(total / req.pagination.pageSize) };
      return sendSuccess(res, sequences, 'Sequences retrieved successfully', meta);
    } catch (error) { next(error); }
  }

  async getSequenceById(req, res, next) {
    try {
      const sequence = await this.sequenceService.getSequenceById(req.user.id, req.params.id);
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
