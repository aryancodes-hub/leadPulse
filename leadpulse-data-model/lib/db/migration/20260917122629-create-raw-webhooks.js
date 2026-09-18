'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('raw_webhooks', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'sendgrid'
      },
      status: {
        type: Sequelize.ENUM('pending', 'processed', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('raw_webhooks');
    // Drop the custom ENUM type that Postgres creates automatically
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_raw_webhooks_status";');
  }
};