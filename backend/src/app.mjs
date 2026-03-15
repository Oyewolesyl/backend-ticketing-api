import 'dotenv/config';
import express from 'express';
import logger from './logger.mjs';
import { initDb } from './db.mjs';
import eventsRouter   from './routes/events.mjs';
import bookingsRouter from './routes/bookings.mjs';

const app  = express();
const PORT = process.env.PORT || 3000;

/* ------------------------------------------------------------------ */
/*  Global middleware                                                   */
/* ------------------------------------------------------------------ */
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    body: req.body,
  });
  next();
});

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */
app.use('/api/events',   eventsRouter);
app.use('/api/bookings', bookingsRouter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

/* ------------------------------------------------------------------ */
/*  Start                                                              */
/* ------------------------------------------------------------------ */
async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      logger.info(`Ticketing API listening on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

start();
