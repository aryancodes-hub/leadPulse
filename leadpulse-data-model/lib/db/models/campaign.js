const { Model, DataTypes } = require("sequelize");

class Campaign extends Model {
  static initModel(sequelize) {
    Campaign.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        clientId: { type: DataTypes.UUID, allowNull: false, references: { model: "clients", key: "id" } },
        leadListId: { type: DataTypes.UUID, allowNull: false, references: { model: "lead_lists", key: "id" } },
        sequenceId: { type: DataTypes.UUID, allowNull: false, references: { model: "sequences", key: "id" } },
        requiresNetNewLeads: { type: DataTypes.BOOLEAN, defaultValue: false },
        createdByUserId: { type: DataTypes.UUID, allowNull: false, references: { model: "users", key: "id" } },
        name: { type: DataTypes.STRING, allowNull: false },
        type: { type: DataTypes.ENUM("email", "call"), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        categoryTag: { type: DataTypes.STRING, allowNull: true },
        status: { type: DataTypes.ENUM("draft", "active", "paused", "completed"), defaultValue: "draft" },
        dispatchStatus: { type: DataTypes.ENUM("not_sent", "sending", "sent"), defaultValue: "not_sent" },
        segmentationFilters: { type: DataTypes.JSONB, allowNull: true },
        excludeClosedLeads: { type: DataTypes.BOOLEAN, defaultValue: true },
        pricingModel: { type: DataTypes.ENUM("flat_retainer", "cost_per_lead"), allowNull: true },
        retainerAmount: { type: DataTypes.NUMERIC, allowNull: true },
        ratePerLead: { type: DataTypes.NUMERIC, allowNull: true },
        budgetAlert90Sent: { type: DataTypes.BOOLEAN, defaultValue: false },
        budgetAlert100Sent: { type: DataTypes.BOOLEAN, defaultValue: false },
        requiresManagerApproval: { type: DataTypes.BOOLEAN, defaultValue: true },
        approvedByUserId: { type: DataTypes.UUID, allowNull: true, references: { model: "users", key: "id" } },
        approvedAt: { type: DataTypes.DATE, allowNull: true },
        subjectLine: { type: DataTypes.STRING, allowNull: true },
        senderName: { type: DataTypes.STRING, allowNull: true },
        replyToEmail: { type: DataTypes.STRING, allowNull: true },
        emailBodyHtml: { type: DataTypes.TEXT, allowNull: true },
        bannerImageUrl: { type: DataTypes.STRING, allowNull: true },
        scheduleType: { type: DataTypes.STRING, allowNull: true },
        scheduledAt: { type: DataTypes.DATE, allowNull: true }
      },
      { sequelize, modelName: "Campaign", tableName: "campaigns", underscored: true, timestamps: true }
    );
    return Campaign;
  }
  static associate(models) {
    Campaign.belongsTo(models.Client, { foreignKey: "clientId", as: "client" });
    Campaign.belongsTo(models.LeadList, { foreignKey: "leadListId", as: "leadList" });
    Campaign.belongsTo(models.Sequence, { foreignKey: "sequenceId", as: "sequence" });
    Campaign.belongsTo(models.User, { foreignKey: "createdByUserId", as: "createdBy" });
    Campaign.belongsTo(models.User, { foreignKey: "approvedByUserId", as: "approvedBy" });
    Campaign.hasMany(models.CampaignExecutive, { foreignKey: "campaignId", as: "executives" });
    Campaign.hasMany(models.CampaignLead, { foreignKey: "campaignId", as: "leads" });
  }
}
module.exports = Campaign;
