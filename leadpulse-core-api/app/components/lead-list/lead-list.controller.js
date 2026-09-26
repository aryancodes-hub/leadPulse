const LeadListService = require('./lead-list.service');
const { sendSuccess } = require('../../utils/response-wrapper');

class LeadListController {
  constructor() {
    this.leadListService = new LeadListService();
  }

  /**
   * @swagger
   * /api/v1/lead-lists/upload:
   *   post:
   *     summary: Uploads CSV to S3 and triggers background Import Service
   *     tags: [Lead Ingestion]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *               name:
   *                 type: string
   *               clientId:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       201:
   *         description: File uploaded and import job queued
   */
  async uploadList(req, res, next) {
    try {
      const { name, clientId } = req.body;
      const result = await this.leadListService.uploadList(req.user.id, clientId, name, req.file);
      return sendSuccess(res, result, 'Lead list uploaded successfully', null, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/lead-imports/{jobId}/status:
   *   get:
   *     summary: Polls processing status of an import job
   *     tags: [Lead Ingestion]
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
   *         description: Import job status details
   */
  async getImportStatus(req, res, next) {
    try {
      const job = await this.leadListService.getImportStatus(req.user.id, req.params.jobId);
      return sendSuccess(res, job, 'Import status retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/lead-lists:
   *   get:
   *     summary: Fetches all lead list audience containers for a specific client
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
   *         description: Paginated lead lists
   */
  async getLeadLists(req, res, next) {
    try {
      const clientId = req.query.clientId;
      const { lists, total } = await this.leadListService.getLeadLists(req.user.id, clientId, req.pagination, req.user.role);
      
      const meta = {
        total,
        page: req.pagination.page,
        pageSize: req.pagination.pageSize,
        totalPages: Math.ceil(total / req.pagination.pageSize)
      };

      return sendSuccess(res, lists, 'Lead lists retrieved successfully', meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/lead-lists/{id}:
   *   get:
   *     summary: Gets list overview and latest import job status
   *     tags: [Lead Ingestion]
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
   *         description: Lead list details
   */
  async getLeadListById(req, res, next) {
    try {
      const list = await this.leadListService.getLeadListById(req.user.id, req.params.id);
      return sendSuccess(res, list, 'Lead list retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/lead-lists/{id}/members:
   *   get:
   *     summary: Returns paginated list of actual leads inside a specific list container
   *     tags: [Lead Ingestion]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
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
   *         description: Paginated list members
   */
  async getListMembers(req, res, next) {
    try {
      const { members, total } = await this.leadListService.getListMembers(req.user.id, req.params.id, req.pagination);
      
      const meta = {
        total,
        page: req.pagination.page,
        pageSize: req.pagination.pageSize,
        totalPages: Math.ceil(total / req.pagination.pageSize)
      };

      return sendSuccess(res, members, 'List members retrieved successfully', meta);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LeadListController;
