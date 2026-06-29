const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret_jwt_access_token_key_12345',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'super_secret_jwt_refresh_token_key_12345',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
