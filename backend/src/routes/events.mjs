import { Router } from 'express';
import pool from '../db.mjs';
import logger from '../logger.mjs';
import {
  requireFields,
  positiveInt,
  validDate,
} from '../middleware/validate.mjs';

const router = Router();

/* ------------------------------------------------------------------ */
/*  GET /api/events  – list all events ordered by event_date           */
/* ------------------------------------------------------------------ */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM events ORDER BY event_date ASC'
    );
    res.json(rows);
  } catch (err) {
    logger.error('GET /api/events failed', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/events/:id                                                */
/* ------------------------------------------------------------------ */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM events WHERE id = $1', [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: `Event with id ${req.params.id} not found` });
    }
    res.json(rows[0]);
  } catch (err) {
    logger.error('GET /api/events/:id failed', { error: err.message, id: req.params.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/events                                                   */
/* ------------------------------------------------------------------ */
router.post(
  '/',
  requireFields(['name', 'location', 'event_date', 'capacity']),
  validDate('event_date'),
  positiveInt('capacity'),
  async (req, res) => {
    const { name, location, event_date, capacity } = req.body;
    try {
      const { rows } = await pool.query(
        `INSERT INTO events (name, location, event_date, capacity)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name, location, event_date, capacity]
      );
      logger.info('Event created', { id: rows[0].id, name });
      res.status(201).json(rows[0]);
    } catch (err) {
      logger.error('POST /api/events failed', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/* ------------------------------------------------------------------ */
/*  PUT /api/events/:id                                                */
/* ------------------------------------------------------------------ */
router.put('/:id', async (req, res) => {
  const { name, location, event_date, capacity } = req.body;

  // Validate optional fields when provided
  if (event_date !== undefined) {
    const d = new Date(event_date);
    if (isNaN(d.getTime())) {
      return res.status(400).json({ error: "'event_date' must be a valid ISO date string" });
    }
  }
  if (capacity !== undefined) {
    const cap = Number(capacity);
    if (!Number.isInteger(cap) || cap < 1) {
      return res.status(400).json({ error: "'capacity' must be an integer greater than or equal to 1" });
    }
  }

  try {
    // Check event exists
    const existing = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: `Event with id ${req.params.id} not found` });
    }

    const current = existing.rows[0];
    const { rows } = await pool.query(
      `UPDATE events
         SET name       = $1,
             location   = $2,
             event_date = $3,
             capacity   = $4,
             updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        name       ?? current.name,
        location   ?? current.location,
        event_date ?? current.event_date,
        capacity   !== undefined ? Number(capacity) : current.capacity,
        req.params.id,
      ]
    );
    logger.info('Event updated', { id: rows[0].id });
    res.json(rows[0]);
  } catch (err) {
    logger.error('PUT /api/events/:id failed', { error: err.message, id: req.params.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/*  DELETE /api/events/:id  – cascades to bookings via FK              */
/* ------------------------------------------------------------------ */
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM events WHERE id = $1', [
      req.params.id,
    ]);
    if (rowCount === 0) {
      return res.status(404).json({ error: `Event with id ${req.params.id} not found` });
    }
    logger.info('Event deleted', { id: req.params.id });
    res.status(204).send();
  } catch (err) {
    logger.error('DELETE /api/events/:id failed', { error: err.message, id: req.params.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/events/:id/bookings  – confirmed bookings for event       */
/* ------------------------------------------------------------------ */
router.get('/:id/bookings', async (req, res) => {
  try {
    const event = await pool.query('SELECT id FROM events WHERE id = $1', [req.params.id]);
    if (event.rows.length === 0) {
      return res.status(404).json({ error: `Event with id ${req.params.id} not found` });
    }

    const { rows } = await pool.query(
      `SELECT * FROM bookings
        WHERE event_id = $1 AND status = 'confirmed'
        ORDER BY created_at ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    logger.error('GET /api/events/:id/bookings failed', { error: err.message, id: req.params.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/events/:id/seats-left                                     */
/* ------------------------------------------------------------------ */
router.get('/:id/seats-left', async (req, res) => {
  try {
    const eventRes = await pool.query('SELECT capacity FROM events WHERE id = $1', [
      req.params.id,
    ]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: `Event with id ${req.params.id} not found` });
    }

    const { capacity } = eventRes.rows[0];
    const bookedRes = await pool.query(
      `SELECT COALESCE(SUM(seats), 0) AS booked
         FROM bookings
        WHERE event_id = $1 AND status = 'confirmed'`,
      [req.params.id]
    );

    const booked = parseInt(bookedRes.rows[0].booked, 10);
    res.json({
      event_id: parseInt(req.params.id, 10),
      capacity,
      booked_seats: booked,
      seats_left: capacity - booked,
    });
  } catch (err) {
    logger.error('GET /api/events/:id/seats-left failed', { error: err.message, id: req.params.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
