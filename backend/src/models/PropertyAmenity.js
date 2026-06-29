const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const PropertyAmenity = sequelize.define('PropertyAmenity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  property_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  amenity_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  organization_id: {
    type: DataTypes.UUID,
    allowNull: true,
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
  tableName: 'property_amenities',
});

module.exports = PropertyAmenity;
