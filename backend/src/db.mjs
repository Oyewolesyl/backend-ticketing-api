import pg from 'pg';
import logger from './logger.mjs';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  logger.info('New database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error', { error: err.message });
});

/**
 * Run the initial SQL migrations to create tables if they don't exist.
 */
export async function initDb() {
  const sql = `
    CREATE TABLE IF NOT EXISTS events (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(255) NOT NULL,
      location    VARCHAR(255) NOT NULL,
      event_date  TIMESTAMPTZ  NOT NULL,
      capacity    INTEGER      NOT NULL CHECK (capacity > 0),
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id           SERIAL PRIMARY KEY,
      event_id     INTEGER      NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name         VARCHAR(255) NOT NULL,
      email        VARCHAR(255) NOT NULL,
      seats        INTEGER      NOT NULL CHECK (seats > 0),
      status       VARCHAR(20)  NOT NULL DEFAULT 'confirmed'
                                CHECK (status IN ('confirmed', 'cancelled')),
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);
    CREATE INDEX IF NOT EXISTS idx_events_event_date  ON events(event_date);
  `;

  await pool.query(sql);
  logger.info('Database tables initialised');
}

export default pool;
