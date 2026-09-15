const { Model, DataTypes } = require("sequelize");

class Sequence extends Model {
  static initModel(sequelize) {
    Sequence.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        clientId: { type: DataTypes.UUID, allowNull: false, references: { model: "clients", key: "id" } },
        name: { type: DataTypes.STRING, allowNull: false, unique: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        leadListId: { type: DataTypes.UUID, allowNull: false, references: { model: "lead_lists", key: "id" } }
      },
      { sequelize, modelName: "Sequence", tableName: "sequences", underscored: true, timestamps: true }
    );
    return Sequence;
  }
  static associate(models) {
    Sequence.belongsTo(models.Client, { foreignKey: "clientId", as: "client" });
    Sequence.belongsTo(models.LeadList, { foreignKey: "leadListId", as: "leadList" });
    Sequence.hasMany(models.Campaign, { foreignKey: "sequenceId", as: "campaigns" });
  }
}
module.exports = Sequence;
