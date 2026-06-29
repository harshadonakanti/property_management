const { AuditLog } = require('../models');
const logger = require('../config/logger');

const logAudit = async ({ req, action, tableName, recordId, oldValues, newValues }) => {
  try {
    const ipAddress = req && req.headers ? (req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress)) : null;
    const organization_id = req && req.user ? req.user.organization_id : null;
    const user_id = req && req.user ? req.user.id : null;

    await AuditLog.create({
      organization_id,
      user_id,
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues || null,
      new_values: newValues || null,
      ip_address: ipAddress
    });
  } catch (error) {
    logger.error('Failed to write audit log: %o', error);
  }
};

module.exports = { logAudit };
