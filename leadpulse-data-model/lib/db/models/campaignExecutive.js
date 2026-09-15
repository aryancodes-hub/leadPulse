const { Model, DataTypes } = require("sequelize");

class CampaignExecutive extends Model {
  static initModel(sequelize) {
    CampaignExecutive.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        campaignId: { type: DataTypes.UUID, allowNull: false, references: { model: "campaigns", key: "id" } },
        executiveUserId: { type: DataTypes.UUID, allowNull: false, references: { model: "users", key: "id" } },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
        unassignedAt: { type: DataTypes.DATE, allowNull: true }
      },
      { sequelize, modelName: "CampaignExecutive", tableName: "campaign_executives", underscored: true, timestamps: true, updatedAt: false }
    );
    return CampaignExecutive;
  }
  static associate(models) {
    CampaignExecutive.belongsTo(models.Campaign, { foreignKey: "campaignId", as: "campaign" });
    CampaignExecutive.belongsTo(models.User, { foreignKey: "executiveUserId", as: "executive" });
  }
}
module.exports = CampaignExecutive;
