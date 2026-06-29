const { Client } = require('pg');
const env = require('../config/env.config');
const logger = require('../config/logger');

async function initSchema() {
  const client = new Client({
    connectionString: env.databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    logger.info('Connected to PostgreSQL to verify schema');
    await client.query('CREATE SCHEMA IF NOT EXISTS master;');
    logger.info('Schema "master" verified/created successfully');
  } catch (error) {
    logger.error('Failed to create master schema: %o', error);
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  initSchema()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = initSchema;
