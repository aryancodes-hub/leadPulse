const { Model, DataTypes } = require("sequelize");

class ImportJob extends Model {
  static initModel(sequelize) {
    ImportJob.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        clientId: { type: DataTypes.UUID, allowNull: false, references: { model: "clients", key: "id" } },
        leadListId: { type: DataTypes.UUID, allowNull: false, references: { model: "lead_lists", key: "id" } },
        uploadedByUserId: { type: DataTypes.UUID, allowNull: false, references: { model: "users", key: "id" } },
        s3SourceFileKey: { type: DataTypes.STRING, allowNull: false },
        s3ErrorFileKey: { type: DataTypes.STRING, allowNull: true },
        status: { type: DataTypes.ENUM("Uploaded", "Queued", "Processing", "Completed", "Completed_with_Errors", "Failed"), defaultValue: "Uploaded" },
        totalRows: { type: DataTypes.INTEGER, defaultValue: 0 },
        processedRows: { type: DataTypes.INTEGER, defaultValue: 0 },
        successfulRows: { type: DataTypes.INTEGER, defaultValue: 0 },
        failedRows: { type: DataTypes.INTEGER, defaultValue: 0 },
        progressPercentage: { type: DataTypes.NUMERIC, defaultValue: 0 }
      },
      { sequelize, modelName: "ImportJob", tableName: "import_jobs", underscored: true, timestamps: true }
    );
    return ImportJob;
  }
  static associate(models) {
    ImportJob.belongsTo(models.Client, { foreignKey: "clientId", as: "client" });
    ImportJob.belongsTo(models.LeadList, { foreignKey: "leadListId", as: "leadList", constraints: false });
    ImportJob.belongsTo(models.User, { foreignKey: "uploadedByUserId", as: "uploadedBy" });
  }
}
module.exports = ImportJob;
