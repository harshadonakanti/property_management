const sequelize = require('../config/db.config');

async function run() {
  console.log('Starting migration...');
  try {
    await sequelize.authenticate();
    console.log('Connected to Neon database.');

    // Add columns if they don't exist
    await sequelize.query('ALTER TABLE master.users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);');
    await sequelize.query('ALTER TABLE master.users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);');
    await sequelize.query('ALTER TABLE master.users ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(255);');
    
    await sequelize.query("ALTER TABLE master.users ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'Active';");
    await sequelize.query("UPDATE master.users SET status = 'Active' WHERE status IS NULL;");
    await sequelize.query("ALTER TABLE master.users ALTER COLUMN status SET NOT NULL;");

    await sequelize.query('ALTER TABLE master.users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;');
    await sequelize.query("UPDATE master.users SET is_deleted = false WHERE is_deleted IS NULL;");
    await sequelize.query("ALTER TABLE master.users ALTER COLUMN is_deleted SET NOT NULL;");

    await sequelize.query('ALTER TABLE master.users ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN DEFAULT false;');
    await sequelize.query("UPDATE master.users SET is_revoked = false WHERE is_revoked IS NULL;");
    await sequelize.query("ALTER TABLE master.users ALTER COLUMN is_revoked SET NOT NULL;");

    await sequelize.query('ALTER TABLE master.users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES master.roles(id) ON UPDATE CASCADE ON DELETE SET NULL;');

    console.log('Columns added. Starting backfill...');

    // Backfill role_id from user_roles
    await sequelize.query(`
      UPDATE master.users u
      SET role_id = ur.role_id
      FROM master.user_roles ur
      WHERE u.id = ur.user_id AND ur.is_active = true AND u.role_id IS NULL;
    `);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();
