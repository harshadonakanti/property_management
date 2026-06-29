const env = require('../config/env.config');

module.exports = {
  development: {
    url: env.databaseUrl,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    migrationStorageTableName: 'sequelize_meta',
    seederStorageTableName: 'sequelize_data'
  },
  production: {
    url: env.databaseUrl,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    migrationStorageTableName: 'sequelize_meta',
    seederStorageTableName: 'sequelize_data'
  }
};
