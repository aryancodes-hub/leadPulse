const CallQueueService = require('./call-queue.service');
const { sendSuccess } = require('../../utils/response-wrapper');

class CallQueueController {
  constructor() {
    this.service = new CallQueueService();
  }

  async getNextLead(req, res, next) {
    try {
      const lead = await this.service.getNextLead(req.user.id, req.params.id);
      return sendSuccess(res, lead, lead ? 'Next lead retrieved' : 'Queue is empty');
    } catch (error) { next(error); }
  }

  async skipLead(req, res, next) {
    try {
      const lead = await this.service.skipLead(req.user.id, req.params.id, req.params.leadId);
      return sendSuccess(res, lead, 'Lead skipped successfully');
    } catch (error) { next(error); }
  }

  async createCallRemark(req, res, next) {
    try {
      const remark = await this.service.createCallRemark(req.user.id, req.body);
      return sendSuccess(res, remark, 'Call remark logged successfully', null, 201);
    } catch (error) { next(error); }
  }

  async getCallRemarks(req, res, next) {
    try {
      const result = await this.service.getCallRemarks(req.user.id, req.params.id, req.pagination);
      const meta = { total: result.total, page: req.pagination.page, pageSize: req.pagination.pageSize, totalPages: Math.ceil(result.total / req.pagination.pageSize) };
      return sendSuccess(res, result.remarks, 'Call remarks retrieved', meta);
    } catch (error) { next(error); }
  }

  async confirmConversion(req, res, next) {
    try {
      const {remark, alreadyConfirmed} = await this.service.confirmConversion(req.user.id, req.params.id, req.body.conversionConfirmed);
      const message = alreadyConfirmed 
        ? 'This conversion was already confirmed previously.' 
        : 'Conversion confirmation updated';
      return sendSuccess(res, remark, message);
    } catch (error) { next(error); }
  }
}
module.exports = CallQueueController;

/**
 * @swagger
 * tags:
 *   name: Call Queue
 *   description: Executive dialing queue and manager remarks
 * 
 * /api/v1/campaigns/{id}/queue/next:
 *   post:
 *     tags: [Call Queue]
 *     summary: Fetch next lead in executive queue
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
 *         description: Next lead retrieved
 * 
 * /api/v1/campaigns/{id}/queue/{leadId}/skip:
 *   post:
 *     tags: [Call Queue]
 *     summary: Skip an in-progress lead
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lead skipped
 * 
 * /api/v1/call-remarks:
 *   post:
 *     tags: [Call Queue]
 *     summary: Log a call remark and trigger conversions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [campaignId, clientLeadId, callOutcome]
 *             properties:
 *               campaignId:
 *                 type: string
 *                 format: uuid
 *               clientLeadId:
 *                 type: string
 *                 format: uuid
 *               callOutcome:
 *                 type: string
 *                 enum: [Answered, Not_Answered, Busy, Wrong_Number, Left_Voicemail, Callback_Requested, Not_Interested, Converted]
 *               callDurationMinutes:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Call remark created
 * 
 * /api/v1/campaigns/{id}/call-remarks:
 *   get:
 *     tags: [Call Queue]
 *     summary: Get call remarks for a campaign
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
 *         description: List of call remarks
 * 
 * /api/v1/call-remarks/{id}/confirm:
 *   patch:
 *     tags: [Call Queue]
 *     summary: Manager confirms a lead conversion
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [conversionConfirmed]
 *             properties:
 *               conversionConfirmed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Conversion confirmed
 */

