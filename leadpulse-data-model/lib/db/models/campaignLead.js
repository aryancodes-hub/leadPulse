const { Model, DataTypes } = require("sequelize");

class CampaignLead extends Model {
  static initModel(sequelize) {
    CampaignLead.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        campaignId: { type: DataTypes.UUID, allowNull: false, references: { model: "campaigns", key: "id" } },
        clientLeadId: { type: DataTypes.UUID, allowNull: false, references: { model: "client_leads", key: "id" } },
        assignedExecutiveId: { type: DataTypes.UUID, allowNull: true, references: { model: "users", key: "id" } },
        assignedAt: { type: DataTypes.DATE, allowNull: true },
        status: { type: DataTypes.ENUM("pending", "in_progress", "called", "skipped", "completed"), defaultValue: "pending" },
        statusUpdatedAt: { type: DataTypes.DATE, allowNull: true }
      },
      { sequelize, modelName: "CampaignLead", tableName: "campaign_leads", underscored: true, timestamps: true, indexes: [{ unique: true, fields: ["campaign_id", "client_lead_id"] }] }
    );
    return CampaignLead;
  }
  static associate(models) {
    CampaignLead.belongsTo(models.Campaign, { foreignKey: "campaignId", as: "campaign" });
    CampaignLead.belongsTo(models.ClientLead, { foreignKey: "clientLeadId", as: "clientLead" });
    CampaignLead.belongsTo(models.User, { foreignKey: "assignedExecutiveId", as: "executive" });
  }
}
module.exports = CampaignLead;
