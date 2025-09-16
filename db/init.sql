-- SQL initialization for Neon DB (optional)
CREATE TABLE IF NOT EXISTS drivers (id BIGINT PRIMARY KEY, name TEXT, cpf TEXT, email TEXT, phone TEXT, city TEXT, state TEXT, password TEXT, vehicletype TEXT, vehicleplate TEXT, photos JSONB, paymentstatus TEXT, paymentmethod TEXT, registrationdate TIMESTAMPTZ, billingtype TEXT);
CREATE TABLE IF NOT EXISTS payments (id BIGINT PRIMARY KEY, driverid BIGINT REFERENCES drivers(id) ON DELETE CASCADE, amount NUMERIC, method TEXT, status TEXT, date TIMESTAMPTZ, raw JSONB);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value JSONB);
-- Admins table to store admin accounts (passwords should be hashed)
CREATE TABLE IF NOT EXISTS admins (id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
