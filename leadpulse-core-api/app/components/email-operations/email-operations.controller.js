const EmailOperationsService = require('./email-operations.service');
const { sendSuccess } = require('../../utils/response-wrapper');

class EmailOperationsController {
  constructor() {
    this.service = new EmailOperationsService();
  }

  async dispatchEmail(req, res, next) {
    try {
      const job = await this.service.dispatchEmail(req.user.id, req.params.id);
      return sendSuccess(res, job, 'Email dispatch queued successfully', null, 202);
    } catch (error) { next(error); }
  }

  async getJobStatus(req, res, next) {
    try {
      const job = await this.service.getJobStatus(req.user.id, req.params.jobId);
      return sendSuccess(res, job, 'Job status retrieved');
    } catch (error) { next(error); }
  }


}
module.exports = EmailOperationsController;

/**
 * @swagger
 * tags:
 *   name: Email Operations
 *   description: Dispatching and tracking for email campaigns
 * 
 * /api/v1/campaigns/{id}/dispatch-email:
 *   post:
 *     tags: [Email Operations]
 *     summary: Trigger background email microservice
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
 *       202:
 *         description: Job queued
 * 
 * /api/v1/email-jobs/{jobId}/status:
 *   get:
 *     tags: [Email Operations]
 *     summary: Check email dispatch progress
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Job status
 * 
 * /api/v1/webhooks/sendgrid:
 *   post:
 *     tags: [Email Operations]
 *     summary: Process SendGrid webhook events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: Processed
 * 
 * /api/v1/track/open:
 *   get:
 *     tags: [Email Operations]
 *     summary: Tracking pixel for email opens
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 1x1 image buffer
 * 
 * /api/v1/track/click:
 *   get:
 *     tags: [Email Operations]
 *     summary: Tracking link for email clicks
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirects to target url
 * 
 * /api/v1/track/unsubscribe:
 *   get:
 *     tags: [Email Operations]
 *     summary: Process unsubscribe requests
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success message
 */

