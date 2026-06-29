const { Client, Pool } = require('pg');
const env = require('./config/env.config');

async function testRaw() {
  console.log('Testing pg Client with DATABASE_URL...');
  const client = new Client({
    connectionString: env.databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('pg Client Connected successfully!');
    const res = await client.query('SELECT * FROM master.users WHERE email = $1', ['admin@housestays.com']);
    console.log('QUERY RESULT ROWS:', res.rows.length);
    if (res.rows.length > 0) {
      console.log('USER ROW:', res.rows[0]);
    }
    await client.end();
  } catch (err) {
    console.error('pg Client ERROR:', err);
  }
}

testRaw();
