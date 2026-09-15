const { Model, DataTypes } = require("sequelize");

class Client extends Model {
  static initModel(sequelize) {
    Client.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        contactPerson: { type: DataTypes.STRING, allowNull: true },
        contactEmail: { type: DataTypes.STRING, allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
      },
      { sequelize, modelName: "Client", tableName: "clients", underscored: true, timestamps: true }
    );
    return Client;
  }
  static associate(models) {
    Client.hasOne(models.ClientManager, { foreignKey: "clientId", as: "managerLink" });
    Client.hasMany(models.Sequence, { foreignKey: "clientId", as: "sequences" });
    Client.hasMany(models.ClientLead, { foreignKey: "clientId", as: "leads" });
  }
}
module.exports = Client;
