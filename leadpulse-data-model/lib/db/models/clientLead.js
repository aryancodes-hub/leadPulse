const { Model, DataTypes } = require("sequelize");

class ClientLead extends Model {
  static initModel(sequelize) {
    ClientLead.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        clientId: { type: DataTypes.UUID, allowNull: false, references: { model: "clients", key: "id" } },
        masterContactId: { type: DataTypes.UUID, allowNull: false, references: { model: "master_contacts", key: "id" } },
        source: { type: DataTypes.STRING, allowNull: true },
        isDnc: { type: DataTypes.BOOLEAN, defaultValue: false },
        isUnsubscribed: { type: DataTypes.BOOLEAN, defaultValue: false }
      },
      { sequelize, modelName: "ClientLead", tableName: "client_leads", underscored: true, timestamps: true, indexes: [{ unique: true, fields: ["client_id", "master_contact_id"] }] }
    );
    return ClientLead;
  }
  static associate(models) {
    ClientLead.belongsTo(models.Client, { foreignKey: "clientId", as: "client" });
    ClientLead.belongsTo(models.MasterContact, { foreignKey: "masterContactId", as: "masterContact" });
    ClientLead.hasMany(models.LeadListMembership, { foreignKey: "clientLeadId", as: "memberships" });
  }
}
module.exports = ClientLead;
