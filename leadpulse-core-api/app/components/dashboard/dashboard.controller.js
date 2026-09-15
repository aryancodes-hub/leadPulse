const DashboardService = require('./dashboard.service');
const { sendSuccess } = require('../../utils/response-wrapper');

class DashboardController {
  constructor() {
    this.service = new DashboardService();
  }

  async getManagerSummary(req, res, next) {
    try {
      const summary = await this.service.getManagerSummary(req.user.id);
      return sendSuccess(res, summary, 'Manager summary retrieved');
    } catch (error) { next(error); }
  }

  async getExecPerformance(req, res, next) {
    try {
      const performance = await this.service.getExecPerformance(req.user.id, req.user.role, req.query.executiveUserId);
      return sendSuccess(res, performance, 'Executive performance retrieved');
    } catch (error) { next(error); }
  }

  async getClientPortalSummary(req, res, next) {
    try {
      const clientId = req.user.role === 'client' ? req.user.clientId : req.query.clientId;
      const summary = await this.service.getClientPortalSummary(req.user.id, req.user.role, clientId);
      return sendSuccess(res, summary, 'Client portal summary retrieved');
    } catch (error) { next(error); }
  }
}
module.exports = DashboardController;

/**
 * @swagger
 * tags:
 *   name: Dashboards
 *   description: Real-time aggregated metrics
 * 
 * /api/v1/dashboards/manager-summary:
 *   get:
 *     tags: [Dashboards]
 *     summary: System-wide snapshot for managers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics
 * 
 * /api/v1/dashboards/exec-performance:
 *   get:
 *     tags: [Dashboards]
 *     summary: Live KPIs for an executive
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: executiveUserId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Execution metrics
 * 
 * /api/v1/dashboards/client-portal:
 *   get:
 *     tags: [Dashboards]
 *     summary: Client ROI and campaign stats
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Client metrics
 */
