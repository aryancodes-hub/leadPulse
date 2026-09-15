const { Model, DataTypes } = require("sequelize");

class EmailProcessingJob extends Model {
  static initModel(sequelize) {
    EmailProcessingJob.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        campaignId: { type: DataTypes.UUID, allowNull: false, references: { model: "campaigns", key: "id" } },
        status: { type: DataTypes.ENUM("Queued", "Processing", "Completed", "Failed"), defaultValue: "Queued" },
        totalEmails: { type: DataTypes.INTEGER, defaultValue: 0 },
        processedEmails: { type: DataTypes.INTEGER, defaultValue: 0 },
        successfulSends: { type: DataTypes.INTEGER, defaultValue: 0 },
        failedSends: { type: DataTypes.INTEGER, defaultValue: 0 }
      },
      { sequelize, modelName: "EmailProcessingJob", tableName: "email_processing_jobs", underscored: true, timestamps: true }
    );
    return EmailProcessingJob;
  }
  static associate(models) {
    EmailProcessingJob.belongsTo(models.Campaign, { foreignKey: "campaignId", as: "campaign" });
  }
}
module.exports = EmailProcessingJob;
