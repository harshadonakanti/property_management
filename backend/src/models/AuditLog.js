const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  organization_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  table_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  record_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  old_values: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  new_values: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: 'audit_logs',
  updatedAt: false,
});

module.exports = AuditLog;
