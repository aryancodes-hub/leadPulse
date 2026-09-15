const { Client, ClientManager, User, sequelize } = require("leadpulse-data-model");
const { NotFoundError, ConflictError, BadRequestError } = require("../../lib/error");
const bcrypt = require('bcryptjs');

class ClientService {
  async createClient(data) {
    const { name, contactPerson, contactEmail, password, managerId } = data;

    // Verify manager exists and is a campaign_manager
    const manager = await User.findByPk(managerId);
    if (!manager) {
      throw new NotFoundError("Assigned manager does not exist");
    }
    if (manager.role !== "campaign_manager") {
      throw new BadRequestError("Assigned user must have the 'campaign_manager' role");
    }

    // Verify email isn't already used for a user login
    const existingUser = await User.findOne({ where: { email: contactEmail } });
    if (existingUser) {
      throw new ConflictError("A user with this contact email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Execute in a transaction to ensure Client, ClientManager, and User portal login are created together
    return await sequelize.transaction(async (t) => {
      const client = await Client.create(
        {
          name,
          contactPerson,
          contactEmail
        },
        { transaction: t }
      );

      await ClientManager.create(
        {
          clientId: client.id,
          userId: managerId
        },
        { transaction: t }
      );

      // Generate the Client Portal Login
      await User.create({
        role: 'client',
        clientId: client.id,
        fullName: contactPerson,
        email: contactEmail,
        passwordHash,
        managerId: managerId // Link the portal user to the campaign manager who created it
      }, { transaction: t });

      return client;
    });
  }

  async getClients(pagination) {
    const { limit, offset } = pagination;

    const { count, rows } = await Client.findAndCountAll({
      limit,
      offset,
      include: [
        {
          model: ClientManager,
          as: "managerLink",
          include: [{ model: User, as: "manager", attributes: ["id", "fullName", "email"] }]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    return { clients: rows, total: count };
  }

  async getClientById(id) {
    const client = await Client.findByPk(id, {
      include: [
        {
          model: ClientManager,
          as: "managerLink",
          include: [{ model: User, as: "manager", attributes: ["id", "fullName", "email"] }]
        }
      ]
    });

    if (!client) {
      throw new NotFoundError("Client not found");
    }

    return client;
  }

  async updateClient(id, data) {
    const client = await this.getClientById(id);

    const updatableFields = ["name", "contactPerson", "contactEmail", "isActive"];
    const updateData = {};

    updatableFields.forEach((field) => {
      if (data[field] !== undefined) updateData[field] = data[field];
    });

    // Only hit the database if there are actually fields to update
    if (Object.keys(updateData).length > 0) {
      await client.update(updateData);
    }

    // Reload to return the updated client along with its nested manager info
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
