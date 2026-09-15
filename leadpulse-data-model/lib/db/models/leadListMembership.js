const { Model, DataTypes } = require("sequelize");

class LeadListMembership extends Model {
  static initModel(sequelize) {
    LeadListMembership.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        leadListId: { type: DataTypes.UUID, allowNull: false, references: { model: "lead_lists", key: "id" } },
        clientLeadId: { type: DataTypes.UUID, allowNull: false, references: { model: "client_leads", key: "id" } },
        addedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        status: { type: DataTypes.ENUM("Pending", "Converted", "Dead", "Callback", "Unreachable"), defaultValue: "Pending" }
      },
      { sequelize, modelName: "LeadListMembership", tableName: "lead_list_memberships", underscored: true, timestamps: true, updatedAt: "updatedAt", createdAt: "addedAt", indexes: [{ unique: true, fields: ["lead_list_id", "client_lead_id"] }] }
    );
    return LeadListMembership;
  }
  static associate(models) {
    LeadListMembership.belongsTo(models.LeadList, { foreignKey: "leadListId", as: "leadList" });
    LeadListMembership.belongsTo(models.ClientLead, { foreignKey: "clientLeadId", as: "clientLead" });
  }
}
module.exports = LeadListMembership;
