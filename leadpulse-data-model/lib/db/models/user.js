const { Model, DataTypes } = require("sequelize");

class User extends Model {
  static initModel(sequelize) {
    User.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        role: { type: DataTypes.ENUM("campaign_manager", "executive", "client"), allowNull: false },
        managerId: { type: DataTypes.UUID, allowNull: true, references: { model: "users", key: "id" } },
        clientId: { type: DataTypes.UUID, allowNull: true, references: { model: "clients", key: "id" } },
        fullName: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        passwordHash: { type: DataTypes.STRING, allowNull: false },
        refreshTokenHash: { type: DataTypes.STRING, allowNull: true },
        refreshTokenExpiresAt: { type: DataTypes.DATE, allowNull: true },
        resetTokenHash: { type: DataTypes.STRING, allowNull: true },
        resetTokenExpiresAt: { type: DataTypes.DATE, allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
        lastLoginAt: { type: DataTypes.DATE, allowNull: true }
      },
      { sequelize, modelName: "User", tableName: "users", underscored: true, timestamps: true }
    );
    return User;
  }
  static associate(models) {
    User.belongsTo(models.User, { foreignKey: "managerId", as: "manager" });
    User.belongsTo(models.Client, { foreignKey: "clientId", as: "client" });
    User.hasMany(models.User, { foreignKey: "managerId", as: "subordinates" });
    User.hasMany(models.ClientManager, { foreignKey: "userId", as: "managedClients" });
  }
}
module.exports = User;
