<template>
  <div class="events-page">

    <!-- Page header -->
    <div class="page-header">
      <h1 class="page-title">ALL<br><span>EVENTS</span></h1>
      <button class="btn primary" @click="showCreate = !showCreate">
        {{ showCreate ? '— Close' : '+ New Event' }}
      </button>
    </div>

    <!-- Create event form -->
    <transition name="slide">
      <div v-if="showCreate" class="create-panel">
        <div class="panel-label">
          <span class="tag yellow">New Event</span>
        </div>
        <div class="error-msg" v-if="createError">{{ createError }}</div>
        <form @submit.prevent="submitCreate" class="event-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Event Name</label>
              <input class="input" v-model="form.name" placeholder="Vilvoorde Jazz Festival" required />
            </div>
            <div class="form-group">
              <label class="form-label">Location</label>
              <input class="input" v-model="form.location" placeholder="Vilvoorde, Belgium" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date & Time</label>
              <input class="input" type="datetime-local" v-model="form.event_date" required />
            </div>
            <div class="form-group">
              <label class="form-label">Capacity</label>
              <input class="input" type="number" v-model="form.capacity" placeholder="500" min="1" required />
            </div>
          </div>
          <button class="btn primary" type="submit" :disabled="creating">
            {{ creating ? 'Creating...' : 'Create Event' }}
          </button>
        </form>
      </div>
    </transition>

    <hr class="divider" />

    <!-- Loading -->
    <div v-if="loading" class="loader">Loading events</div>

    <!-- Error -->
    <div v-else-if="error" class="error-msg">{{ error }}</div>

    <!-- Empty -->
    <div v-else-if="events.length === 0" class="empty-state">
      <p class="mono muted">— No events yet. Create one above.</p>
    </div>

    <!-- Events grid -->
    <div v-else class="events-grid">
      <div
        v-for="(event, i) in events"
        :key="event.id"
        class="event-card"
        :style="{ animationDelay: `${i * 60}ms` }"
      >
        <div class="card-top">
          <span class="event-number mono muted">{{ String(event.id).padStart(2, '0') }}</span>
          <span class="tag" :class="seatsClass(event)">
            {{ seatsLeft[event.id] !== undefined ? seatsLeft[event.id] + ' seats left' : '...' }}
          </span>
        </div>
        <h2 class="event-name">{{ event.name }}</h2>
        <div class="event-meta">
          <span class="mono">📍 {{ event.location }}</span>
          <span class="mono">{{ formatDate(event.event_date) }}</span>
        </div>
        <div class="card-footer">
          <span class="mono muted">Cap. {{ event.capacity }}</span>
          <div class="card-actions">
            <router-link :to="`/events/${event.id}`" class="btn">View</router-link>
            <button class="btn danger" @click="deleteEvent(event.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api.js'

const events    = ref([])
const seatsLeft = ref({})
const loading   = ref(true)
const error     = ref(null)
const showCreate = ref(false)
const creating  = ref(false)
const createError = ref(null)

const form = ref({ name: '', location: '', event_date: '', capacity: '' })

async function load() {
  loading.value = true
  error.value = null
  try {
    events.value = await api.getEvents()
    // fetch seats for each event
    for (const e of events.value) {
      const s = await api.getSeatsLeft(e.id)
      seatsLeft.value[e.id] = s.seats_left
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function submitCreate() {
  createError.value = null
  creating.value = true
  try {
    const payload = {
      name: form.value.name,
      location: form.value.location,
      event_date: new Date(form.value.event_date).toISOString(),
      capacity: parseInt(form.value.capacity),
    }
    await api.createEvent(payload)
    form.value = { name: '', location: '', event_date: '', capacity: '' }
    showCreate.value = false
    await load()
  } catch (e) {
    createError.value = e.message
  } finally {
    creating.value = false
  }
}

async function deleteEvent(id) {
  if (!confirm('Delete this event and all its bookings?')) return
  try {
    await api.deleteEvent(id)
    await load()
  } catch (e) {
    alert(e.message)
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-BE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function seatsClass(event) {
  const s = seatsLeft.value[event.id]
  if (s === undefined) return ''
  if (s === 0) return 'red'
  if (s < event.capacity * 0.2) return 'yellow'
  return 'green'
}

onMounted(load)
</script>

<style scoped>
.events-page { animation: fadeUp 0.4s ease both; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 2rem;
}

/* Create panel */
.create-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 2rem;
  margin-bottom: 2rem;
}
.panel-label { margin-bottom: 1.5rem; }

.event-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

/* Slide transition */
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.slide-enter-from, .slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.slide-enter-to, .slide-leave-from { max-height: 600px; }

/* Events grid */
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1px;
  background: var(--border);
}

.event-card {
  background: var(--bg);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: fadeUp 0.4s ease both;
  transition: background 0.2s;
}
.event-card:hover { background: var(--surface); }

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-number {
  font-size: 0.7rem;
  letter-spacing: 0.1em;
}

.event-name {
  font-family: var(--font-display);
  font-size: 1.8rem;
  letter-spacing: 0.04em;
  line-height: 1;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: var(--muted);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  font-size: 0.75rem;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.empty-state {
  padding: 4rem 0;
  font-size: 0.9rem;
}
</style>
