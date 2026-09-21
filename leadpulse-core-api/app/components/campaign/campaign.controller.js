const CampaignService = require("./campaign.service");
const { sendSuccess } = require("../../utils/response-wrapper");

class CampaignController {
  constructor() {
    this.campaignService = new CampaignService();
  }

  async createCampaign(req, res, next) {
    try {
      const campaign = await this.campaignService.createCampaign(req.user.id, req.body);
      return sendSuccess(res, campaign, "Campaign created and leads synced", null, 201);
    } catch (error) {
      next(error);
    }
  }

  async getCampaigns(req, res, next) {
    try {
      const clientId = req.query.clientId;
      const { campaigns, total } = await this.campaignService.getCampaigns(
        req.user.id,
        clientId,
        req.pagination,
        req.user.role
      );

      // Reshape data to strictly match ManagerCampaigns.jsx expectations
      const formattedCampaigns = campaigns.map((c) => {
        const cData = c.toJSON ? c.toJSON() : c;

        // Capitalize status ('active' -> 'Active')
        const status = cData.status
          ? cData.status.charAt(0).toUpperCase() + cData.status.slice(1)
          : "Draft";

        // Map backend enum to frontend display strings
        const type =
          cData.type === "call"
            ? "Cold Call Blitz"
            : cData.type === "email"
              ? "Email Sequence Drip"
              : cData.type;

        return {
          id: cData.id,
          name: cData.name, 
          clientName: cData.client?.name || cData.clientId, 
          type: type,
          status: status,
          executives: (cData.executives || []).map((ex) => ({
          id: ex.executive?.id,
          name: ex.executive?.fullName,
          email: ex.executive?.email,
          status: ex.executive?.isActive ? "Active" : "Inactive",
          assignedat: ex.createdAt,
          unassignedat: ex.unassignedAt
          }))
        };
      });

      const meta = {
        total,
        page: req.pagination.page,
        pageSize: req.pagination.pageSize,
        totalPages: Math.ceil(total / req.pagination.pageSize)
      };

      // Nest inside a 'campaigns' object so data.campaigns works on the frontend
      return sendSuccess(
        res,
        { campaigns: formattedCampaigns },
        "Campaigns retrieved successfully",
        meta
      );
    } catch (error) {
      next(error);
    }
  }

  async getCampaignById(req, res, next) {
    try {
      const campaign = await this.campaignService.getCampaign(req.user.id, req.params.id);
      return sendSuccess(res, campaign, "Campaign retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateCampaign(req, res, next) {
    try {
      const campaign = await this.campaignService.updateCampaign(
        req.user.id,
        req.params.id,
        req.body
      );
      return sendSuccess(res, campaign, "Campaign updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteCampaign(req, res, next) {
    try {
      await this.campaignService.deleteCampaign(req.user.id, req.params.id);
      return sendSuccess(res, null, "Campaign deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const campaign = await this.campaignService.updateStatus(
        req.user.id,
        req.params.id,
        req.body.status
      );
      return sendSuccess(res, campaign, "Campaign status updated");
    } catch (error) {
      next(error);
    }
  }

  async approveCampaign(req, res, next) {
    try {
      const campaign = await this.campaignService.approveCampaign(req.user.id, req.params.id);
      return sendSuccess(res, campaign, "Campaign approved and set to active");
    } catch (error) {
      next(error);
    }
  }
}
module.exports = CampaignController;

/**
 * @swagger
 * tags:
 *   name: Campaigns
 *   description: Campaign logic and settings
 *
 * /api/v1/campaigns:
 *   get:
 *     tags: [Campaigns]
 *     summary: Get all campaigns for a client
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
 *         description: List of campaigns
 *   post:
 *     tags: [Campaigns]
 *     summary: Create a campaign and sync audience
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, leadListId, sequenceId, name, type]
 *             properties:
 *               clientId:
 *                 type: string
 *               leadListId:
 *                 type: string
 *               sequenceId:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [email, call]
 *     responses:
 *       201:
 *         description: Campaign created
 *
 * /api/v1/campaigns/{id}:
 *   get:
 *     tags: [Campaigns]
 *     summary: Get campaign by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign details
 *   patch:
 *     tags: [Campaigns]
 *     summary: Update campaign
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Campaign updated
 *   delete:
 *     tags: [Campaigns]
 *     summary: Delete a draft campaign
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign deleted
 *
 * /api/v1/campaigns/{id}/status:
 *   patch:
 *     tags: [Campaigns]
 *     summary: Update campaign status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, active, paused, completed]
 *     responses:
 *       200:
 *         description: Status updated
 *
 * /api/v1/campaigns/{id}/approve:
 *   post:
 *     tags: [Campaigns]
 *     summary: Approve a draft campaign
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign approved
 */
