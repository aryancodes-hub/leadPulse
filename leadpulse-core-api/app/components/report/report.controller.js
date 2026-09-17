const ReportService = require('./report.service');
const { sendSuccess } = require('../../utils/response-wrapper');

class ReportController {
  constructor() {
    this.service = new ReportService();
  }

  async getCampaignSummary(req, res, next) {
    try {
      const data = await this.service.getCampaignSummary(req.user, req.params.id);
      return sendSuccess(res, data, 'Campaign analytics retrieved');
    } catch (error) { next(error); }
  }

  async exportEngagements(req, res, next) {
    try {
      const data = await this.service.exportEngagements(req.user, req.query.campaignId);
      // For MVP API, return raw mapped JSON. A frontend or Puppeteer microservice will build the Excel file.
      return sendSuccess(res, data, 'Engagement data ready for export');
    } catch (error) { next(error); }
  }

  async exportConverted(req, res, next) {
    try {
      const data = await this.service.exportConverted(req.user, req.query.campaignId);
      return sendSuccess(res, data, 'Converted leads data ready for export');
    } catch (error) { next(error); }
  }
}
module.exports = ReportController;

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Analytics extractions and CSV/Excel handoffs
 * 
 * /api/v1/reports/campaign-summary/{id}:
 *   get:
 *     tags: [Reports]
 *     summary: Deep breakdown of a specific campaign
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
 *         description: Report data
 * 
 * /api/v1/reports/export/engagements:
 *   get:
 *     tags: [Reports]
 *     summary: Export email engagements
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: campaignId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Flat JSON intended for CSV builder
 * 
 * /api/v1/reports/export/converted:
 *   get:
 *     tags: [Reports]
 *     summary: Export converted MQLs with PII
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: campaignId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Flat JSON intended for Client handoff
 */

