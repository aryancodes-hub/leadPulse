const { Sequelize } = require("sequelize");
const dbConfig = require("./lib/config/database");
const { initModels } = require("./lib/db/models");

const env = process.env.NODE_ENV || "development";
const config = dbConfig[env];

const sequelize = new Sequelize(config.database, config.username, config.password, config);
const models = initModels(sequelize);

module.exports = {
  sequelize,
  ...models
};
