const { User } = require('leadpulse-data-model');
const { NotFoundError, ConflictError, ForbiddenError } = require('../../lib/error');
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

  async getUsers(managerId, pagination) {
    const { limit, offset } = pagination;
    
    const { count, rows } = await User.findAndCountAll({
      where: { managerId, role: 'executive' },
      limit,
      offset,
      attributes: { exclude: ['passwordHash', 'refreshTokenHash', 'resetTokenHash'] },
      order: [['createdAt', 'DESC']]
    });

    return { users: rows, total: count };
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
