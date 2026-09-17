const { Client, ClientManager, User, sequelize } = require("leadpulse-data-model");
const { NotFoundError, ConflictError, BadRequestError, ForbiddenError } = require("../../lib/error");
const bcrypt = require('bcryptjs');

class ClientService {
  async verifyManagerAccess(userId, clientId) {
    const link = await ClientManager.findOne({ where: { userId, clientId } });
    if (!link) throw new ForbiddenError("You do not have permission to manage this client.");
  }

  async createClient(data) {
    const { name, contactPerson, contactEmail, password, managerId } = data;

    const manager = await User.findByPk(managerId);
    if (!manager) throw new NotFoundError("Assigned manager does not exist");
    if (manager.role !== "campaign_manager") throw new BadRequestError("Assigned user must have the 'campaign_manager' role");

    const existingUser = await User.findOne({ where: { email: contactEmail } });
    if (existingUser) throw new ConflictError("A user with this contact email already exists.");

    const passwordHash = await bcrypt.hash(password, 12);

    return await sequelize.transaction(async (t) => {
      const client = await Client.create({ name, contactPerson, contactEmail }, { transaction: t });
      await ClientManager.create({ clientId: client.id, userId: managerId }, { transaction: t });
      await User.create({
        role: 'client',
        clientId: client.id,
        fullName: contactPerson,
        email: contactEmail,
        passwordHash,
        managerId: managerId 
      }, { transaction: t });

      return client;
    });
  }

  async getClients(userId, pagination) {
    const { limit, offset } = pagination;
    const { count, rows } = await Client.findAndCountAll({
      include: [
        {
          model: ClientManager,
          as: "managerLink",
          where: { userId }, // SECURE: Filters directly by requester ID
          include: [{ model: User, as: "manager", attributes: ["id", "fullName", "email"] }]
        }
      ],
      limit, offset, order: [["createdAt", "DESC"]]
    });
    return { clients: rows, total: count };
  }

  async getClientById(userId, id) {
    const client = await Client.findByPk(id, {
      include: [
        {
          model: ClientManager,
          as: "managerLink",
          include: [{ model: User, as: "manager", attributes: ["id", "fullName", "email"] }]
        }
      ]
    });

    if (!client) throw new NotFoundError("Client not found");
    
    await this.verifyManagerAccess(userId, client.id);

    return client;
  }

  async updateClient(userId, id, data) {
    const client = await this.getClientById(userId, id); // Security check is baked into getClientById

    const updatableFields = ["name", "contactPerson", "contactEmail", "isActive"];
    const updateData = {};
    updatableFields.forEach((field) => {
      if (data[field] !== undefined) updateData[field] = data[field];
    });

    if (Object.keys(updateData).length > 0) {
      await client.update(updateData);
    }

    return client.reload({
      include: [
        {
          model: ClientManager,
          as: "managerLink",
          include: [{ model: User, as: "manager", attributes: ["id", "fullName", "email"] }]
        }
      ]
    });
  }
}

module.exports = ClientService;
