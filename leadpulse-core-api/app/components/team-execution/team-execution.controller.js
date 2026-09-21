const TeamExecutionService = require('./team-execution.service');
const { sendSuccess } = require('../../utils/response-wrapper');

class TeamExecutionController {
  constructor() {
    this.service = new TeamExecutionService();
  }

  async getExecutives(req, res, next) {
    try {
      const {executives, total} = await this.service.getExecutives(req.params.id);
      const formatedExecutives = executives.map((exec)=>{
        const execData = exec.toJson ? exec.toJSON() : exec;

        return {
          id: execData.id,
          campaignId: execData.campaignId,
          executiveId: execData.executiveUserId,
          isActive: execData.isActive,
          unassignedAt: execData.unassignedAt,
          createdAt: execData.createdAt ,
          name: execData.executive.fullName,
          email: execData.executive.email
        }
      })
      const meta = {
        total
      }
      const data = formatedExecutives
      return sendSuccess(res , data, 'Campaign executives retrieved', meta);
    } catch (error) { next(error); }
  }

  async addExecutive(req, res, next) {
    try {
      const assignment = await this.service.addExecutive(req.user.id, req.params.id, req.body.executiveUserId);
      return sendSuccess(res, assignment, 'Executive assigned to campaign', null, 201);
    } catch (error) { next(error); }
  }

  async removeExecutive(req, res, next) {
    try {
      const reassignToUserId = req.query.reassignToUserId || null;
      await this.service.removeExecutive(req.user.id, req.params.id, req.params.execId, reassignToUserId);
      const msg = reassignToUserId ? 'Executive removed and leads securely transferred' : 'Executive removed and pending leads unassigned';
      return sendSuccess(res, null, msg);
    } catch (error) { next(error); }
  }

  async assignLeads(req, res, next) {
    try {
      const result = await this.service.assignLeadsRoundRobin(req.user.id, req.params.id);
      return sendSuccess(res, result, `Successfully assigned ${result.assignedCount} leads`);
    } catch (error) { next(error); }
  }
}
module.exports = TeamExecutionController;

/**
 * @swagger
 * tags:
 *   name: Team Execution
 *   description: Campaign executive assignments and bulk operations
 * 
 * /api/v1/campaigns/{id}/executives:
 *   get:
 *     tags: [Team Execution]
 *     summary: Get executives assigned to campaign
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
 *         description: List of assigned executives
 *   post:
 *     tags: [Team Execution]
 *     summary: Assign executive to campaign
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
 *             required: [executiveUserId]
 *             properties:
 *               executiveUserId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Executive assigned
 * 
 * /api/v1/campaigns/{id}/executives/{execId}:
 *   delete:
 *     tags: [Team Execution]
 *     summary: Remove executive from campaign
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
 *         name: execId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: reassignToUserId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Target executive UUID to transfer pending leads to
 *     responses:
 *       200:
 *         description: Executive removed
 * 
 * /api/v1/campaigns/{id}/assign-leads:
 *   post:
 *     tags: [Team Execution]
 *     summary: Round-robin assign leads to executives
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
 *             required: [method]
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [round_robin]
 *     responses:
 *       200:
 *         description: Leads assigned
 */
