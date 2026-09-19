const ClientService = require('./client.service');
const { sendSuccess } = require('../../utils/response-wrapper');

class ClientController {
  constructor() {
    this.clientService = new ClientService();
  }

  /**
   * @swagger
   * /api/v1/clients:
   *   post:
   *     summary: Create a new client and assign a campaign manager
   *     tags: [Clients]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, contactPerson, contactEmail, password, managerId]
   *             properties:
   *               name:
   *                 type: string
   *                 example: Acme Corp
   *               contactPerson:
   *                 type: string
   *                 example: Jane Doe
   *               contactEmail:
   *                 type: string
   *                 format: email
   *                 example: jane@acmecorp.com
   *               password:
   *                 type: string
   *                 format: password
   *                 example: InitialPassword123! 
   *               managerId:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       201:
   *         description: Client created successfully
   *       400:
   *         description: Validation failed or invalid manager
   *       409:
   *         description: Client already has a manager assigned
   */
  async createClient(req, res, next) {
    try {
      const client = await this.clientService.createClient(req.body);
      return sendSuccess(res, client, 'Client created successfully', null, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/clients:
   *   get:
   *     summary: List all clients (paginated)
   *     tags: [Clients]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *         description: Number of items per page
   *     responses:
   *       200:
   *         description: A list of clients
   */
    async getClients(req, res, next) {
    try {
      const { clients, total } = await this.clientService.getClients(req.user.id, req.pagination);
      
      // 1 & 2. Format the data to exactly match the React frontend's expectations
      const formattedClients = clients.map(c => {
        const clientData = c.toJSON ? c.toJSON() : c;
        return {
          ...clientData,
          status: clientData.isActive ? "Active" : "Paused",
          activeCampaigns: clientData.activeCampaigns || 0 // Default to 0 if not returned by DB
        };
      });

      const meta = {
        total,
        page: req.pagination.page,
        pageSize: req.pagination.pageSize,
        totalPages: Math.ceil(total / req.pagination.pageSize)
      };

      // Wrap the array inside an object with the key 'clients'
      return sendSuccess(res, { clients: formattedClients }, 'Clients retrieved successfully', meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/clients/{id}:
   *   get:
   *     summary: Get a client by ID
   *     tags: [Clients]
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
   *         description: Client details
   *       404:
   *         description: Client not found
   */
  async getClientById(req, res, next) {
    try {
      const client = await this.clientService.getClientById(req.user.id, req.params.id);
      return sendSuccess(res, client, 'Client retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/clients/{id}:
   *   patch:
   *     summary: Updates client active status (or other fields)
   *     tags: [Clients]
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
   *               name:
   *                 type: string
   *               contactPerson:
   *                 type: string
   *               contactEmail:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Client updated successfully
   *       404:
   *         description: Client not found
   */
  async updateClient(req, res, next) {
    try {
      const client = await this.clientService.updateClient(req.user.id, req.params.id, req.body);
      return sendSuccess(res, client, 'Client updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ClientController;



