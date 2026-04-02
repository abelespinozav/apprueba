require('dotenv').config()
const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      google_id VARCHAR UNIQUE NOT NULL,
      email VARCHAR,
      name VARCHAR,
      picture VARCHAR,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ramos (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      nombre VARCHAR NOT NULL,
      min_aprobacion DECIMAL DEFAULT 4.0,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS evaluaciones (
      id SERIAL PRIMARY KEY,
      ramo_id INTEGER REFERENCES ramos(id) ON DELETE CASCADE,
      nombre VARCHAR NOT NULL,
      ponderacion DECIMAL NOT NULL,
      nota DECIMAL,
      fecha DATE,
      plan_estudio JSONB,
      tareas_completadas JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS archivos (
      id SERIAL PRIMARY KEY,
      evaluacion_id INTEGER REFERENCES evaluaciones(id) ON DELETE CASCADE,
      nombre VARCHAR NOT NULL,
      ruta VARCHAR NOT NULL,
      tipo VARCHAR,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `)
  console.log('✅ Migración completada')
  await pool.end()
}

migrate().catch(console.error)
