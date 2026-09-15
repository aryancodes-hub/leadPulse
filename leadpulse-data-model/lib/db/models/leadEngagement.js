const { Model, DataTypes } = require("sequelize");

class LeadEngagement extends Model {
  static initModel(sequelize) {
    LeadEngagement.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        campaignId: { type: DataTypes.UUID, allowNull: false, references: { model: "campaigns", key: "id" } },
        clientLeadId: { type: DataTypes.UUID, allowNull: false, references: { model: "client_leads", key: "id" } },
        trackingToken: { type: DataTypes.STRING, allowNull: false, unique: true },
        status: { type: DataTypes.ENUM("sent", "delivered", "bounced", "spamreport"), defaultValue: "sent" },
        sentAt: { type: DataTypes.DATE, allowNull: true },
        deliveredAt: { type: DataTypes.DATE, allowNull: true },
        openedAt: { type: DataTypes.DATE, allowNull: true },
        clickedAt: { type: DataTypes.DATE, allowNull: true },
        convertedAt: { type: DataTypes.DATE, allowNull: true },
        unsubscribedAt: { type: DataTypes.DATE, allowNull: true },
        openCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        clickCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        bounceType: { type: DataTypes.STRING, allowNull: true },
        errorMessage: { type: DataTypes.TEXT, allowNull: true }
      },
      { sequelize, modelName: "LeadEngagement", tableName: "lead_engagements", underscored: true, timestamps: true, updatedAt: false }
    );
    return LeadEngagement;
  }
  static associate(models) {
    LeadEngagement.belongsTo(models.Campaign, { foreignKey: "campaignId", as: "campaign" });
    LeadEngagement.belongsTo(models.ClientLead, { foreignKey: "clientLeadId", as: "clientLead" });
  }
}
module.exports = LeadEngagement;
