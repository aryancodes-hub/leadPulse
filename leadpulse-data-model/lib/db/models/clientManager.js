const { Model, DataTypes } = require("sequelize");

class ClientManager extends Model {
  static initModel(sequelize) {
    ClientManager.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        clientId: { 
          type: DataTypes.UUID, 
          allowNull: false, 
          unique: true, 
          references: { model: "clients", key: "id" } 
        },
        userId: { 
          type: DataTypes.UUID, 
          allowNull: false, 
          references: { model: "users", key: "id" } 
        }
      },
      { sequelize, modelName: "ClientManager", tableName: "client_managers", underscored: true, timestamps: true }
    );
    return ClientManager;
  }
  static associate(models) {
    ClientManager.belongsTo(models.Client, { foreignKey: "clientId", as: "client" });
    ClientManager.belongsTo(models.User, { foreignKey: "userId", as: "manager" });
  }
}
module.exports = ClientManager;
