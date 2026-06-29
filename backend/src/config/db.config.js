const { Sequelize } = require('sequelize');
const env = require('./env.config');
const logger = require('./logger');

const sequelize = new Sequelize(env.databaseUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  define: {
    schema: 'master',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  logging: (msg) => logger.debug(msg)
});

module.exports = sequelize;
