const { Model, DataTypes } = require("sequelize");

class CallRemark extends Model {
  static initModel(sequelize) {
    CallRemark.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        campaignId: { type: DataTypes.UUID, allowNull: false, references: { model: "campaigns", key: "id" } },
        clientLeadId: { type: DataTypes.UUID, allowNull: false, references: { model: "client_leads", key: "id" } },
        executiveUserId: { type: DataTypes.UUID, allowNull: false, references: { model: "users", key: "id" } },
        callOutcome: { type: DataTypes.ENUM("Answered", "Not_Answered", "Busy", "Wrong_Number", "Left_Voicemail", "Callback_Requested", "Not_Interested", "Converted"), allowNull: false },
        callDurationMinutes: { type: DataTypes.INTEGER, allowNull: true },
        notes: { type: DataTypes.STRING(1000), allowNull: true },
        followUpDate: { type: DataTypes.DATE, allowNull: true },
        leadStatusUpdate: { type: DataTypes.ENUM("New", "Contacted", "Qualified", "Converted", "Dead"), allowNull: true },
        isManualEntryByManager: { type: DataTypes.BOOLEAN, defaultValue: false },
        conversionConfirmed: { type: DataTypes.BOOLEAN, allowNull: true },
        confirmedByUserId: { type: DataTypes.UUID, allowNull: true, references: { model: "users", key: "id" } },
        confirmedAt: { type: DataTypes.DATE, allowNull: true }
      },
      { sequelize, modelName: "CallRemark", tableName: "call_remarks", underscored: true, timestamps: true, updatedAt: false }
    );
    return CallRemark;
  }
  static associate(models) {
    CallRemark.belongsTo(models.Campaign, { foreignKey: "campaignId", as: "campaign" });
    CallRemark.belongsTo(models.ClientLead, { foreignKey: "clientLeadId", as: "clientLead" });
    CallRemark.belongsTo(models.User, { foreignKey: "executiveUserId", as: "executive" });
    CallRemark.belongsTo(models.User, { foreignKey: "confirmedByUserId", as: "confirmedBy" });
  }
}
module.exports = CallRemark;

