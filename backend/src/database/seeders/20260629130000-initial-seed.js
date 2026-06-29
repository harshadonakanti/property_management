'use strict';
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create a default organization
    const orgId = '11111111-1111-1111-1111-111111111111';
    await queryInterface.bulkInsert({ tableName: 'organizations', schema: 'master' }, [{
      id: orgId,
      org_code: 'ORG001',
      name: 'HouseStays Enterprise Org',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // 2. Create roles
    const superAdminRoleId = '22222222-2222-2222-2222-222222222222';
    const propManagerRoleId = '33333333-3333-3333-3333-333333333333';
    const acctManagerRoleId = '44444444-4444-4444-4444-444444444444';

    await queryInterface.bulkInsert({ tableName: 'roles', schema: 'master' }, [
      {
        id: superAdminRoleId,
        name: 'Super Administrator',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: propManagerRoleId,
        name: 'Property Manager',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: acctManagerRoleId,
        name: 'Account Manager',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // 3. Create default Super Admin user
    const adminUserId = '55555555-5555-5555-5555-555555555555';
    const adminEmail = 'admin@housestays.com';
    const adminPasswordHash = bcrypt.hashSync('Admin@123', 10);

    await queryInterface.bulkInsert({ tableName: 'users', schema: 'master' }, [{
      id: adminUserId,
      organization_id: orgId,
      email: adminEmail,
      password_hash: adminPasswordHash,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // 4. Assign Super Admin role to the user
    await queryInterface.bulkInsert({ tableName: 'user_roles', schema: 'master' }, [{
      id: uuidv4(),
      user_id: adminUserId,
      role_id: superAdminRoleId,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Seed one Property Manager
    const propManagerUserId = '66666666-6666-6666-6666-666666666666';
    const propManagerEmail = 'manager@housestays.com';
    const propManagerHash = bcrypt.hashSync('Manager@123', 10);

    await queryInterface.bulkInsert({ tableName: 'users', schema: 'master' }, [{
      id: propManagerUserId,
      organization_id: orgId,
      email: propManagerEmail,
      password_hash: propManagerHash,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    await queryInterface.bulkInsert({ tableName: 'user_roles', schema: 'master' }, [{
      id: uuidv4(),
      user_id: propManagerUserId,
      role_id: propManagerRoleId,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Seed one Account Manager
    const acctManagerUserId = '77777777-7777-7777-7777-777777777777';
    const acctManagerEmail = 'finance@housestays.com';
    const acctManagerHash = bcrypt.hashSync('Finance@123', 10);

    await queryInterface.bulkInsert({ tableName: 'users', schema: 'master' }, [{
      id: acctManagerUserId,
      organization_id: orgId,
      email: acctManagerEmail,
      password_hash: acctManagerHash,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    await queryInterface.bulkInsert({ tableName: 'user_roles', schema: 'master' }, [{
      id: uuidv4(),
      user_id: acctManagerUserId,
      role_id: acctManagerRoleId,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete({ tableName: 'user_roles', schema: 'master' }, null, {});
    await queryInterface.bulkDelete({ tableName: 'users', schema: 'master' }, null, {});
    await queryInterface.bulkDelete({ tableName: 'roles', schema: 'master' }, null, {});
    await queryInterface.bulkDelete({ tableName: 'organizations', schema: 'master' }, null, {});
  }
};
