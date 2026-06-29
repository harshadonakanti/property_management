const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  organization_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  invoice_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  customer_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  hourly_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  grand_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  payment_status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Unpaid',
  },
  invoice_status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Sent',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  updated_by: {
    type: DataTypes.UUID,
    allowNull: true,
  }
}, {
  tableName: 'invoices',
});

module.exports = Invoice;
