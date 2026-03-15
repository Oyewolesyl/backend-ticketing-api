# Ticketing API

A RESTful backend for a fictional event ticketing platform built with Node.js, Express, and PostgreSQL.

## Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase / Neon compatible)
- **DB Client**: `pg` (node-postgres)
- **Logging**: Winston → `logs/app.log`

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL (and optionally PORT)

# 3. Start the server (tables are auto-created on first run)
npm start

# Development (auto-restarts on file changes – Node 18+)
npm run dev
```

## Environment Variables

| Variable       | Description                        | Default |
|----------------|------------------------------------|---------|
| `DATABASE_URL` | PostgreSQL connection string       | —       |
| `PORT`         | Port the server listens on         | `3000`  |
| `NODE_ENV`     | `development` or `production`      | —       |

## API Reference

### Events

| Method | Endpoint                        | Description                                      |
|--------|---------------------------------|--------------------------------------------------|
| GET    | `/api/events`                   | List all events ordered by `event_date`          |
| GET    | `/api/events/:id`               | Get a single event (404 if not found)            |
| POST   | `/api/events`                   | Create an event                                  |
| PUT    | `/api/events/:id`               | Update an event (partial updates supported)      |
| DELETE | `/api/events/:id`               | Delete an event (cascades to bookings)           |
| GET    | `/api/events/:id/bookings`      | Get confirmed bookings for an event              |
| GET    | `/api/events/:id/seats-left`    | Get remaining seat count                         |

**POST / PUT body fields:**

```json
{
  "name":       "string  (required)",
  "location":   "string  (required)",
  "event_date": "ISO 8601 datetime (required)",
  "capacity":   "positive integer (required)"
}
```

---

### Bookings

| Method | Endpoint                        | Description                                      |
|--------|---------------------------------|--------------------------------------------------|
| POST   | `/api/bookings`                 | Create a booking                                 |
| GET    | `/api/bookings/:id`             | Get a booking with event details (404 if missing)|
| PUT    | `/api/bookings/:id/cancel`      | Cancel a booking (sets `status = 'cancelled'`)   |
| DELETE | `/api/bookings/:id`             | Hard-delete a booking row                        |

**POST body fields:**

```json
{
  "event_id": "positive integer (required)",
  "name":     "string (required)",
  "email":    "valid email (required)",
  "seats":    "positive integer (required)"
}
```

---

## Business Logic

- **Capacity check** — only bookings with `status = 'confirmed'` count against capacity.
- If `requested seats > (capacity − confirmed_seats)` the API returns **409 Conflict**:
  ```json
  { "error": "Not enough seats available. Requested 5 but only 3 seat(s) left for this event." }
  ```
- The capacity check uses a PostgreSQL row-level lock (`SELECT … FOR UPDATE`) inside a transaction to prevent race conditions.

## Error Responses

All errors use the format:

```json
{ "error": "A clear description of what went wrong" }
```

| Status | Meaning                          |
|--------|----------------------------------|
| 400    | Validation error / bad input     |
| 404    | Resource not found               |
| 409    | Insufficient seats               |
| 500    | Internal server error            |
