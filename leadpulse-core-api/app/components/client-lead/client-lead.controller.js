const ClientLeadService = require('./client-lead.service');
const { sendSuccess } = require('../../utils/response-wrapper');

class ClientLeadController {
  constructor() {
    this.clientLeadService = new ClientLeadService();
  }

  /**
   * @swagger
   * /api/v1/client-leads:
   *   get:
   *     summary: Lists client-isolated leads globally
   *     tags: [Lead Ingestion]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: clientId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Paginated list of client leads
   */
  async getClientLeads(req, res, next) {
    try {
      const clientId = req.query.clientId;
      if (!clientId) throw new Error('clientId query parameter is required');

      const { leads, total } = await this.clientLeadService.getClientLeads(req.user.id, clientId, req.pagination);
      
      const meta = {
        total,
        page: req.pagination.page,
        pageSize: req.pagination.pageSize,
        totalPages: Math.ceil(total / req.pagination.pageSize)
      };

      return sendSuccess(res, leads, 'Client leads retrieved successfully', meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/client-leads/{id}/compliance:
   *   patch:
   *     summary: Updates legal flags (DNC, unsubscribed)
   *     tags: [Lead Ingestion]
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
   *             properties:
   *               isDnc:
   *                 type: boolean
   *               isUnsubscribed:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Compliance flags updated successfully
   */
  async updateCompliance(req, res, next) {
    try {
      const lead = await this.clientLeadService.updateCompliance(req.params.id, req.body);
      return sendSuccess(res, lead, 'Compliance updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ClientLeadController;
