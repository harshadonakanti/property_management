const jwt = require('jsonwebtoken');
const env = require('../config/env.config');

const generateAccessToken = (user, roles) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      organizationId: user.organization_id,
      roles: roles || []
    },
    env.jwt.secret,
    { expiresIn: env.jwt.accessExpiration }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user.id
    },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiration }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken
};
