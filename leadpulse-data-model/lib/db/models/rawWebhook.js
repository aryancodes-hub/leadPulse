const { Model, DataTypes } = require("sequelize");

class RawWebhook extends Model {
  static initModel(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        provider: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "sendgrid"
        },
        status: {
          type: DataTypes.ENUM("pending", "processed", "failed"),
          allowNull: false,
          defaultValue: "pending"
        },
        payload: {
          type: DataTypes.JSONB,
          allowNull: false
        },
        errorMessage: {
          type: DataTypes.TEXT,
          allowNull: true
        }
      },
      {
        sequelize,
        modelName: "RawWebhook",
        tableName: "raw_webhooks",
        timestamps: true
      }
    );
  }

  static associate(models) {
    // No associations required for this raw data dump table
  }
}

module.exports = RawWebhook;
