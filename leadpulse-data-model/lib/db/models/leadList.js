const { Model, DataTypes } = require("sequelize");

class LeadList extends Model {
  static initModel(sequelize) {
    LeadList.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        clientId: { type: DataTypes.UUID, allowNull: false, references: { model: "clients", key: "id" } },
        name: { type: DataTypes.STRING, allowNull: false },
        importedByUserId: { type: DataTypes.UUID, allowNull: false, references: { model: "users", key: "id" } }
      },
      { sequelize, modelName: "LeadList", tableName: "lead_lists", underscored: true, timestamps: true }
    );
    return LeadList;
  }
  static associate(models) {
    LeadList.belongsTo(models.Client, { foreignKey: "clientId", as: "client" });
    LeadList.belongsTo(models.User, { foreignKey: "importedByUserId", as: "importedBy" });
    LeadList.hasMany(models.LeadListMembership, { foreignKey: "leadListId", as: "members" });
    LeadList.hasMany(models.ImportJob, { foreignKey: "leadListId", as: "importJobs" });
  }
}
module.exports = LeadList;
