const { Pool } = require('pg');

// Use DATABASE_URL (Neon) provided by Vercel environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL not set; API will fail until configured');
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

let initialized = false;

async function init() {
  if (initialized) return;
  initialized = true;
  // Create tables if not exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS drivers (
      id BIGINT PRIMARY KEY,
      name TEXT,
      cpf TEXT,
      email TEXT,
      phone TEXT,
      city TEXT,
      state TEXT,
      password TEXT,
      vehicletype TEXT,
      vehicleplate TEXT,
      photos JSONB,
      paymentstatus TEXT,
      paymentmethod TEXT,
      registrationdate TIMESTAMPTZ,
      billingtype TEXT
    );

    CREATE TABLE IF NOT EXISTS payments (
      id BIGINT PRIMARY KEY,
      driverid BIGINT REFERENCES drivers(id) ON DELETE CASCADE,
      amount NUMERIC,
      method TEXT,
      status TEXT,
      date TIMESTAMPTZ,
      raw JSONB
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value JSONB
    );
  `);
}

async function query(text, params) {
  await init();
  return pool.query(text, params);
}

module.exports = { query, pool };
