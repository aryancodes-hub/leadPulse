const { User, CampaignExecutive, Campaign, ClientManager, sequelize } = require('leadpulse-data-model');
const { Op } = require('sequelize');
const { NotFoundError, ConflictError, ForbiddenError, BadRequestError } = require('../../lib/error');
const bcrypt = require('bcryptjs');

class UserService {

  async createUser(managerId, data) {
    const { fullName, email, password, role = 'executive', clientId } = data;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictError("A user with this email already exists.");
    }

    if (role === 'client') {
      if (!clientId) throw new BadRequestError("clientId is required to create a client user.");
      const link = await ClientManager.findOne({ where: { userId: managerId, clientId } });
      if (!link) throw new ForbiddenError("You do not manage this client.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      role,
      managerId, // We link both executives and clients to the manager
      clientId: role === 'client' ? clientId : null,
      fullName,
      email,
      passwordHash
    });

    // Strip sensitive info before returning
    const userJson = user.toJSON();
    delete userJson.passwordHash;
    return userJson;
  }

  async getUsers(managerId, pagination, unassigned = false, queryRole = 'executive', queryClientId = null) {
    const { limit, offset } = pagination;
    let whereClause = { managerId, role: queryRole };
    
    if (queryRole === 'client') {
      if (!queryClientId) throw new BadRequestError("clientId is required when fetching client users.");
      whereClause = { role: 'client', clientId: queryClientId };
    }

    // 1. Safe & Optimal filtering for Unassigned (No Raw Literals)
     if (unassigned && queryRole === 'executive') {
      const activeExecs = await CampaignExecutive.findAll({ 
        where: { isActive: true }, 
        attributes: ['executiveUserId'] 
      });
      const assignedIds = activeExecs.map(e => e.executiveUserId);
      if (assignedIds.length > 0) {
        whereClause.id = { [Op.notIn]: assignedIds };
      }
    }
    // 2. Fetch the Users
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      attributes: { exclude: ['passwordHash', 'refreshTokenHash', 'resetTokenHash'] },
      order: [['createdAt', 'DESC']]
    });
    // 3. OPTIMAL BULK FETCH: Get all campaign assignments for these users in one query
    const userIds = rows.map(u => u.id);
    let assignments = [];
    if (userIds.length > 0) {
      assignments = await CampaignExecutive.findAll({
        where: { 
          executiveUserId: { [Op.in]: userIds },
          isActive: true 
        },
        include: [{
          model: Campaign,
          as: 'campaign', // Confirmed from leadpulse_associations.js
          attributes: ['id', 'name']
        }]
      });
    }
    // 4. Map the assignments to the users in-memory
    const usersWithAssignments = rows.map(user => {
      const uData = user.toJSON();
      const userAssignments = assignments.filter(a => a.executiveUserId === uData.id);
      
      if (userAssignments.length > 0) {
        uData.activeCampaigns = userAssignments.map(a => ({
          id: a.campaign.id,
          name: a.campaign.name
        }));
        // Create a comma-separated string for the main table view
        uData.assignedCampaign = userAssignments.map(a => a.campaign.name).join(', ');
      } else {
        uData.activeCampaigns = [];
        uData.assignedCampaign = "Unassigned";
      }
      
      return uData;
    });
    return { users: usersWithAssignments, total: count };
  }

  async getUserById(managerId, userId) {
    const user = await User.findOne({
      where: { id: userId, managerId },
      attributes: { exclude: ['passwordHash', 'refreshTokenHash', 'resetTokenHash'] }
    });

    if (!user) {
      throw new NotFoundError("Executive not found or you do not have permission to view them.");
    }

    return user;
  }

  async updateUser(managerId, userId, data) {
    const user = await User.findOne({ where: { id: userId, managerId } });
    
    if (!user) {
      throw new NotFoundError("Executive not found or you do not have permission to update them.");
    }

    const updatableFields = ['fullName', 'isActive'];
    const updateData = {};
    updatableFields.forEach(field => {
      if (data[field] !== undefined) updateData[field] = data[field];
    });

    await user.update(updateData);
    
    const userJson = user.toJSON();
    delete userJson.passwordHash;
    delete userJson.refreshTokenHash;
    delete userJson.resetTokenHash;
    return userJson;
  }
}

module.exports = UserService;
