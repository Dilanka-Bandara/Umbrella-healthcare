const { Pool } = require('pg');
require('dotenv').config();

// 🚨 ULTIMATE FOOLPROOF CONNECTION 🚨
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // This forces the SSL encryption shield ON for Neon!
  }
});

// Test the connection as soon as the server starts
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
  } else {
    console.log('✅ Successfully connected to Neon Cloud Database!');
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};