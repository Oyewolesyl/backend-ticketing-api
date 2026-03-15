import { Router } from 'express';
import pool from '../db.mjs';
import logger from '../logger.mjs';
import {
  requireFields,
  positiveInt,
  validEmail,
} from '../middleware/validate.mjs';

const router = Router();

/* ------------------------------------------------------------------ */
/*  POST /api/bookings  – create a booking                             */
/* ------------------------------------------------------------------ */
router.post(
  '/',
  requireFields(['event_id', 'name', 'email', 'seats']),
  positiveInt('seats'),
  positiveInt('event_id'),
  validEmail('email'),
  async (req, res) => {
    const { event_id, name, email, seats } = req.body;

    // Use a transaction so the capacity check and insert are atomic
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock the event row to prevent race conditions
      const eventRes = await client.query(
        'SELECT capacity FROM events WHERE id = $1 FOR UPDATE',
        [event_id]
      );
      if (eventRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Event with id ${event_id} not found` });
      }

      const { capacity } = eventRes.rows[0];

      // Count only confirmed bookings
      const bookedRes = await client.query(
        `SELECT COALESCE(SUM(seats), 0) AS booked
           FROM bookings
          WHERE event_id = $1 AND status = 'confirmed'`,
        [event_id]
      );
      const booked = parseInt(bookedRes.rows[0].booked, 10);
      const seatsLeft = capacity - booked;

      if (seats > seatsLeft) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: `Not enough seats available. Requested ${seats} but only ${seatsLeft} seat(s) left for this event.`,
        });
      }

      const { rows } = await client.query(
        `INSERT INTO bookings (event_id, name, email, seats, status)
         VALUES ($1, $2, $3, $4, 'confirmed')
         RETURNING *`,
        [event_id, name, email, seats]
      );
      await client.query('COMMIT');

      logger.info('Booking created', { id: rows[0].id, event_id, seats });
      res.status(201).json(rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('POST /api/bookings failed', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }
);

/* ------------------------------------------------------------------ */
/*  GET /api/bookings/:id  – include event details                     */
/* ------------------------------------------------------------------ */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         b.id,
         b.event_id,
         b.name,
         b.email,
         b.seats,
         b.status,
         b.created_at,
         b.updated_at,
         json_build_object(
           'id',         e.id,
           'name',       e.name,
           'location',   e.location,
           'event_date', e.event_date,
           'capacity',   e.capacity
         ) AS event
       FROM bookings b
       JOIN events   e ON e.id = b.event_id
      WHERE b.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: `Booking with id ${req.params.id} not found` });
    }
    res.json(rows[0]);
  } catch (err) {
    logger.error('GET /api/bookings/:id failed', { error: err.message, id: req.params.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/*  PUT /api/bookings/:id/cancel  – set status = 'cancelled'          */
/* ------------------------------------------------------------------ */
router.put('/:id/cancel', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE bookings
          SET status     = 'cancelled',
              updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: `Booking with id ${req.params.id} not found` });
    }
    logger.info('Booking cancelled', { id: req.params.id });
    res.json(rows[0]);
  } catch (err) {
    logger.error('PUT /api/bookings/:id/cancel failed', { error: err.message, id: req.params.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/*  DELETE /api/bookings/:id  – hard delete                            */
/* ------------------------------------------------------------------ */
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM bookings WHERE id = $1', [
      req.params.id,
    ]);
    if (rowCount === 0) {
      return res.status(404).json({ error: `Booking with id ${req.params.id} not found` });
    }
    logger.info('Booking deleted', { id: req.params.id });
    res.status(204).send();
  } catch (err) {
    logger.error('DELETE /api/bookings/:id failed', { error: err.message, id: req.params.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
