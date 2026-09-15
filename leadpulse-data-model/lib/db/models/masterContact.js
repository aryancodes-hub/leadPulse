const { Model, DataTypes } = require("sequelize");

class MasterContact extends Model {
  static initModel(sequelize) {
    MasterContact.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        firstName: { type: DataTypes.STRING, allowNull: true },
        lastName: { type: DataTypes.STRING, allowNull: true },
        phone: { type: DataTypes.STRING, allowNull: true },
        company: { type: DataTypes.STRING, allowNull: true },
        jobTitle: { type: DataTypes.STRING, allowNull: true },
        industry: { type: DataTypes.STRING, allowNull: true }
      },
      { sequelize, modelName: "MasterContact", tableName: "master_contacts", underscored: true, timestamps: true }
    );
    return MasterContact;
  }
  static associate(models) {
    MasterContact.hasMany(models.ClientLead, { foreignKey: "masterContactId", as: "clientLeads" });
  }
}
module.exports = MasterContact;
