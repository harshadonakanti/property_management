const jwt = require('jsonwebtoken');
const env = require('../config/env.config');
const { User, Role } = require('../models');
const logger = require('../config/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwt.secret);

    // Fetch user and verify active status
    const user = await User.findByPk(decoded.userId, {
      include: [
        {
          model: Role,
          as: 'roles',
          attributes: ['name'],
          through: { attributes: [] }
        }
      ]
    });

    if (!user || !user.is_active || user.status !== 'Active' || user.is_deleted || user.is_revoked) {
      return res.status(401).json({ success: false, message: 'User account is inactive, deleted, revoked, or not found' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      organization_id: user.organization_id,
      roles: user.roles.map(r => r.name)
    };

    next();
  } catch (error) {
    logger.error('Authentication error: %o', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = authenticate;
