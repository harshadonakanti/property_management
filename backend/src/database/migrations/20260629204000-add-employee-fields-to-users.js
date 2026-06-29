'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add columns to master.users
    await queryInterface.addColumn(
      { tableName: 'users', schema: 'master' },
      'first_name',
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      { tableName: 'users', schema: 'master' },
      'last_name',
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      { tableName: 'users', schema: 'master' },
      'mobile_number',
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      { tableName: 'users', schema: 'master' },
      'status',
      {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Active'
      }
    );

    await queryInterface.addColumn(
      { tableName: 'users', schema: 'master' },
      'is_deleted',
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    );

    await queryInterface.addColumn(
      { tableName: 'users', schema: 'master' },
      'is_revoked',
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    );

    await queryInterface.addColumn(
      { tableName: 'users', schema: 'master' },
      'role_id',
      {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'roles', schema: 'master' },
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    );

    // Backfill role_id from user_roles
    const [userRoles] = await queryInterface.sequelize.query(
      'SELECT user_id, role_id FROM master.user_roles WHERE is_active = true'
    );
    for (const ur of userRoles) {
      await queryInterface.sequelize.query(
        `UPDATE master.users SET role_id = '${ur.role_id}' WHERE id = '${ur.user_id}'`
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn({ tableName: 'users', schema: 'master' }, 'role_id');
    await queryInterface.removeColumn({ tableName: 'users', schema: 'master' }, 'is_revoked');
    await queryInterface.removeColumn({ tableName: 'users', schema: 'master' }, 'is_deleted');
    await queryInterface.removeColumn({ tableName: 'users', schema: 'master' }, 'status');
    await queryInterface.removeColumn({ tableName: 'users', schema: 'master' }, 'mobile_number');
    await queryInterface.removeColumn({ tableName: 'users', schema: 'master' }, 'last_name');
    await queryInterface.removeColumn({ tableName: 'users', schema: 'master' }, 'first_name');
  }
};
