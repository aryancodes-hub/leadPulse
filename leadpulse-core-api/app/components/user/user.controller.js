const UserService = require('./user.service');
const { sendSuccess } = require('../../utils/response-wrapper');

class UserController {
  constructor() {
    this.userService = new UserService();
  }

  /**
   * @swagger
   * /api/v1/users:
   *   post:
   *     summary: Create a new Executive account
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [fullName, email, password]
   *             properties:
   *               fullName:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 format: password
   *     responses:
   *       201:
   *         description: Executive created successfully
   *       409:
   *         description: User with this email already exists
   */
  async createUser(req, res, next) {
    try {
      const user = await this.userService.createUser(req.user.id, req.body);
      return sendSuccess(res, user, 'Executive created successfully', null, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/users:
   *   get:
   *     summary: List all internal team members (Executives)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
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
   *         description: A paginated list of executives
   */
    async getUsers(req, res, next) {
    try {
      const unassigned = req.query.unassigned === 'true';
      const { users, total } = await this.userService.getUsers(req.user.id, req.pagination, unassigned);
      
      // Reshape data to strictly match the frontend UI expectations
      const formattedUsers = users.map(u => {
        const uData = u.toJSON ? u.toJSON() : u;
        return {
          id: uData.id,
          name: uData.fullName,
          email: uData.email,
          assignedCampaign: uData.assignedCampaign || "Unassigned",
          status: uData.isActive ? "Active" : "Inactive"
        };
      });

      const meta = {
        total,
        page: req.pagination.page,
        pageSize: req.pagination.pageSize,
        totalPages: Math.ceil(total / req.pagination.pageSize)
      };

      // Nest inside a 'users' object so data.users works on the frontend
      return sendSuccess(res, { users: formattedUsers }, 'Executives retrieved successfully', meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/users/{id}:
   *   get:
   *     summary: Get an executive by ID
   *     tags: [Users]
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
   *         description: Executive details
   *       404:
   *         description: Executive not found
   */
  async getUserById(req, res, next) {
    try {
      const user = await this.userService.getUserById(req.user.id, req.params.id);
      return sendSuccess(res, user, 'Executive retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/users/{id}:
   *   patch:
   *     summary: Update an executive's profile or active status
   *     tags: [Users]
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
   *             properties:
   *               fullName:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Executive updated successfully
   *       404:
   *         description: Executive not found
   */
  async updateUser(req, res, next) {
    try {
      const user = await this.userService.updateUser(req.user.id, req.params.id, req.body);
      return sendSuccess(res, user, 'Executive updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
