const sequelize = require('../config/db.config');
const Organization = require('./Organization');
const Role = require('./Role');
const User = require('./User');
const UserRole = require('./UserRole');
const Property = require('./Property');
const Amenity = require('./Amenity');
const PropertyAmenity = require('./PropertyAmenity');
const Booking = require('./Booking');
const Invoice = require('./Invoice');
const AuditLog = require('./AuditLog');

// Associations

// 1. Organization & User
Organization.hasMany(User, { foreignKey: 'organization_id', as: 'users' });
User.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

// 2. User & Role Many-to-Many and Direct Single Role
User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id', otherKey: 'role_id', as: 'roles' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id', otherKey: 'user_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'employees' });

// 3. Organization & Property
Organization.hasMany(Property, { foreignKey: 'organization_id', as: 'properties' });
Property.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

// 4. Organization & Amenity
Organization.hasMany(Amenity, { foreignKey: 'organization_id', as: 'amenities' });
Amenity.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

// 5. Property & Amenity Many-to-Many
Property.belongsToMany(Amenity, { through: PropertyAmenity, foreignKey: 'property_id', otherKey: 'amenity_id', as: 'amenities' });
Amenity.belongsToMany(Property, { through: PropertyAmenity, foreignKey: 'amenity_id', otherKey: 'property_id', as: 'properties' });

// 6. Organization & Booking
Organization.hasMany(Booking, { foreignKey: 'organization_id', as: 'bookings' });
Booking.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

// 7. Booking & Amenity
Amenity.hasMany(Booking, { foreignKey: 'amenity_id', as: 'bookings' });
Booking.belongsTo(Amenity, { foreignKey: 'amenity_id', as: 'amenity' });

// 8. Booking & Property
Property.hasMany(Booking, { foreignKey: 'property_id', as: 'bookings' });
Booking.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// 9. Organization & Invoice
Organization.hasMany(Invoice, { foreignKey: 'organization_id', as: 'invoices' });
Invoice.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

// 10. Booking & Invoice One-to-One
Booking.hasOne(Invoice, { foreignKey: 'booking_id', as: 'invoice' });
Invoice.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// 11. AuditLog Associations
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Organization.hasMany(AuditLog, { foreignKey: 'organization_id', as: 'auditLogs' });
AuditLog.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

module.exports = {
  sequelize,
  Organization,
  Role,
  User,
  UserRole,
  Property,
  Amenity,
  PropertyAmenity,
  Booking,
  Invoice,
  AuditLog
};
