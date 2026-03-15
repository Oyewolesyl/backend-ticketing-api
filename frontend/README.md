# SYL.TICKETS — Event Ticketing Platform

A full-stack event ticketing platform. Node.js/Express backend with a Vue 3 frontend.

---

## Project Structure

```
backend-ticketing-api/
├── backend/                        ← REST API (Node.js + Express + PostgreSQL)
│   ├── src/
│   │   ├── app.mjs                 ← Express app entry point
│   │   ├── db.mjs                  ← PostgreSQL connection + table creation
│   │   ├── logger.mjs              ← Winston logger
│   │   ├── middleware/
│   │   │   └── validate.mjs        ← Request validation middleware
│   │   └── routes/
│   │       ├── events.mjs          ← Event endpoints
│   │       └── bookings.mjs        ← Booking endpoints
│   ├── logs/
│   │   └── app.log                 ← Auto-generated request logs
│   ├── .env.example                ← Environment variable template
│   ├── .gitignore
│   └── package.json
└── frontend/                       ← Vue 3 frontend
    ├── src/
    │   ├── main.js                 ← App entry + Vue Router setup
    │   ├── App.vue                 ← Root layout (header, footer, router-view)
    │   ├── api.js                  ← Centralised API helper
    │   └── views/
    │       ├── EventsView.vue      ← Events list + create event
    │       ├── EventDetailView.vue ← Single event + book seats + bookings list
    │       └── BookingView.vue     ← Single booking + cancel + delete
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Runtime   | Node.js 18+ (ES Modules)          |
| Framework | Express.js                        |
| Database  | PostgreSQL via Neon (serverless)  |
| DB Client | pg (node-postgres)                |
| Logging   | Winston                           |
| Frontend  | Vue 3 + Vue Router + Vite         |

---

## Prerequisites

- Node.js 18 or higher → https://nodejs.org
- A free Neon PostgreSQL database → https://console.neon.tech/signup

---

## Backend Setup

### 1. Go into the backend folder

```bash
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your .env file

```bash
copy .env.example .env
```

Open `.env` and fill in your Neon connection string:

```env
DATABASE_URL=postgresql://neondb_owner:your_password@ep-something.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PORT=3000
NODE_ENV=development
```

### 4. Start the backend server

```bash
npm start
```

You will see:

```
[info]: New database connection established
[info]: Database tables initialised
[info]: Ticketing API listening on port 3000
```

The server auto-creates the `events` and `bookings` tables on first run. No SQL needed.

**Leave this terminal running.**

---

## Frontend Setup

Open a second terminal and go into the frontend folder:

```bash
cd frontend
```

### 1. Install dependencies

```bash
npm install
```

### 2. Start the frontend dev server

```bash
npm run dev
```

You will see:

```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 3. Open in browser

Go to **http://localhost:5173** in your browser.

The frontend automatically proxies all `/api` requests to `http://localhost:3000` so both servers must be running at the same time.

---

## Running Both Servers

You need two terminals open at the same time:

| Terminal | Folder     | Command       | URL                        |
|----------|------------|---------------|----------------------------|
| 1        | `backend`  | `npm start`   | http://localhost:3000      |
| 2        | `frontend` | `npm run dev` | http://localhost:5173      |

Always start the backend first.

---

## API Reference

### Base URL
```
http://localhost:3000/api
```

### Events

| Method | Endpoint                      | Description                                |
|--------|-------------------------------|--------------------------------------------|
| GET    | `/events`                     | List all events ordered by date            |
| GET    | `/events/:id`                 | Get one event (404 if not found)           |
| POST   | `/events`                     | Create an event                            |
| PUT    | `/events/:id`                 | Update an event (partial updates allowed)  |
| DELETE | `/events/:id`                 | Delete event + all its bookings (cascade)  |
| GET    | `/events/:id/bookings`        | Get confirmed bookings for an event        |
| GET    | `/events/:id/seats-left`      | Get remaining seat count                   |

**POST /events body:**
```json
{
  "name":       "Vilvoorde Jazz Festival",
  "location":   "Vilvoorde, Belgium",
  "event_date": "2026-07-15T19:00:00Z",
  "capacity":   500
}
```

### Bookings

| Method | Endpoint                      | Description                                |
|--------|-------------------------------|--------------------------------------------|
| POST   | `/bookings`                   | Create a booking                           |
| GET    | `/bookings/:id`               | Get booking with nested event details      |
| PUT    | `/bookings/:id/cancel`        | Cancel a booking (status = cancelled)      |
| DELETE | `/bookings/:id`               | Hard delete a booking row                  |

**POST /bookings body:**
```json
{
  "event_id": 1,
  "name":     "Jan De Smedt",
  "email":    "jan.desmedt@gmail.com",
  "seats":    3
}
```

### Error Responses

All errors return:
```json
{ "error": "A clear description of what went wrong" }
```

| Status | Meaning                        |
|--------|--------------------------------|
| 400    | Validation error / bad input   |
| 404    | Resource not found             |
| 409    | Not enough seats available     |
| 500    | Internal server error          |

---

## Business Logic

- Only bookings with `status = 'confirmed'` count against capacity
- If `requested seats > (capacity − confirmed_seats)` → 409 Conflict
- Capacity check uses a PostgreSQL row-level lock (`SELECT FOR UPDATE`) inside a transaction to prevent race conditions
- Deleting an event cascades and deletes all its bookings automatically

---

## Frontend Pages

| URL                | Page                                              |
|--------------------|---------------------------------------------------|
| `/`                | All events list + create event form               |
| `/events/:id`      | Event detail + edit + book seats + bookings table |
| `/bookings/:id`    | Booking detail + cancel + delete                  |

---

## Logs

Every request is logged to `backend/logs/app.log`. To view:

```powershell
Get-Content backend\logs\app.log
```

---

## Git

### First push

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/Oyewolesyl/backend-ticketing-api.git
git push -u origin main
```

### Subsequent pushes

```bash
git add .
git commit -m "your message"
git push
```

Your `.env` file is protected by `.gitignore` and will never be pushed to GitHub.

---

## Free Deployment

### Backend — Render (free tier)

1. Go to **https://render.com** and sign up
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Set the following:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables:
   - `DATABASE_URL` → your Neon connection string
   - `NODE_ENV` → `production`
6. Click **Deploy**
7. Render gives you a URL like `https://your-app.onrender.com`

### Frontend — Netlify (free tier)

1. Go to **https://netlify.com** and sign up
2. Click **Add new site** → **Import an existing project**
3. Connect your GitHub repository
4. Set the following:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. Add environment variable:
   - `VITE_API_URL` → your Render backend URL e.g. `https://your-app.onrender.com`
6. Update `frontend/vite.config.js` to use `VITE_API_URL` for production
7. Click **Deploy**

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm start` crashes with `password authentication failed` | Wrong DATABASE_URL in `.env`. Copy it fresh from Neon dashboard |
| `npm start` crashes with `Cannot find module` | You are in the wrong folder. Run `cd backend` first |
| Frontend shows blank page | Backend is not running. Start it with `npm start` in the `backend` folder |
| `Route not found` in browser | You typed a URL that does not exist. Only GET routes work in the browser |
| Port 3000 already in use | Another process is using port 3000. Change `PORT=3001` in `.env` |
