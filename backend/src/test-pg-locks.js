const { Client } = require('pg');
const env = require('./config/env.config');

async function checkLocks() {
  console.log('Connecting to inspect DB locks...');
  const client = new Client({
    connectionString: env.databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected.');
    
    // Query active connections
    const res = await client.query(`
      SELECT pid, usename, state, query, age(clock_timestamp(), query_start) 
      FROM pg_stat_activity 
      WHERE pid <> pg_backend_pid() AND state != 'idle';
    `);

    console.log('Active queries count:', res.rows.length);
    res.rows.forEach(r => {
      console.log(`PID ${r.pid} | State: ${r.state} | Age: ${r.age} | Query: ${r.query}`);
    });

    // Terminate other active backends if any are stuck in transaction
    const killRes = await client.query(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE pid <> pg_backend_pid() AND usename = current_user AND state IN ('active', 'idle in transaction');
    `);
    console.log('Terminated stuck connections count:', killRes.rows.length);

    await client.end();
  } catch (err) {
    console.error('Lock inspection error:', err);
  }
}

checkLocks();
