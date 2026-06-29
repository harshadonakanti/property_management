const { AuditLog, User, Organization } = require('../models');

const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await AuditLog.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email']
        },
        {
          model: Organization,
          as: 'organization',
          attributes: ['name', 'org_code']
        }
      ]
    });

    return res.json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: {
        logs: rows,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };
