<template>
  <div class="event-detail" v-if="event">

    <!-- Back -->
    <router-link to="/" class="back-link mono muted">← All Events</router-link>

    <!-- Event header -->
    <div class="event-header">
      <div class="header-left">
        <span class="tag mono">Event {{ String(event.id).padStart(2,'0') }}</span>
        <h1 class="page-title" style="margin-top:1rem">{{ event.name }}</h1>
        <div class="event-meta mono">
          <span>📍 {{ event.location }}</span>
          <span>🗓 {{ formatDate(event.event_date) }}</span>
        </div>
      </div>
      <div class="seats-block" v-if="seats">
        <div class="seats-number" :class="{ low: seats.seats_left < seats.capacity * 0.2, sold: seats.seats_left === 0 }">
          {{ seats.seats_left }}
        </div>
        <div class="seats-label mono muted">seats remaining</div>
        <div class="seats-bar">
          <div class="seats-fill" :style="{ width: fillWidth }"></div>
        </div>
        <div class="mono muted" style="font-size:0.7rem; margin-top:0.5rem">
          {{ seats.booked_seats }} / {{ seats.capacity }} booked
        </div>
      </div>
    </div>

    <hr class="divider" />

    <!-- Edit toggle -->
    <div class="section-row">
      <span class="section-label mono">Event Details</span>
      <button class="btn" @click="showEdit = !showEdit">{{ showEdit ? 'Cancel' : 'Edit Event' }}</button>
    </div>

    <!-- Edit form -->
    <transition name="slide">
      <div v-if="showEdit" class="panel">
        <div class="error-msg" v-if="editError">{{ editError }}</div>
        <form @submit.prevent="submitEdit" class="event-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Event Name</label>
              <input class="input" v-model="editForm.name" required />
            </div>
            <div class="form-group">
              <label class="form-label">Location</label>
              <input class="input" v-model="editForm.location" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date & Time</label>
              <input class="input" type="datetime-local" v-model="editForm.event_date" required />
            </div>
            <div class="form-group">
              <label class="form-label">Capacity</label>
              <input class="input" type="number" v-model="editForm.capacity" min="1" required />
            </div>
          </div>
          <button class="btn primary" type="submit" :disabled="editing">
            {{ editing ? 'Saving...' : 'Save Changes' }}
          </button>
        </form>
      </div>
    </transition>

    <hr class="divider" />

    <!-- Book seats -->
    <div class="section-row">
      <span class="section-label mono">Book Seats</span>
    </div>

    <div class="panel">
      <div class="error-msg" v-if="bookError">{{ bookError }}</div>
      <div class="success-msg" v-if="bookSuccess">{{ bookSuccess }}</div>
      <form @submit.prevent="submitBooking" class="event-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Your Name</label>
            <input class="input" v-model="bookForm.name" placeholder="Jan De Smedt" required />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="input" type="email" v-model="bookForm.email" placeholder="jan@example.com" required />
          </div>
        </div>
        <div class="form-group" style="max-width:200px">
          <label class="form-label">Number of Seats</label>
          <input class="input" type="number" v-model="bookForm.seats" min="1" :max="seats ? seats.seats_left : 999" required />
        </div>
        <button class="btn primary" type="submit" :disabled="booking || (seats && seats.seats_left === 0)">
          {{ seats && seats.seats_left === 0 ? 'Sold Out' : booking ? 'Booking...' : 'Book Now' }}
        </button>
      </form>
    </div>

    <hr class="divider" />

    <!-- Bookings list -->
    <div class="section-row">
      <span class="section-label mono">Confirmed Bookings</span>
      <span class="tag green">{{ bookings.length }} total</span>
    </div>

    <div v-if="bookings.length === 0" class="empty-state mono muted">
      — No confirmed bookings yet.
    </div>

    <div v-else class="bookings-table">
      <div class="table-header">
        <span class="mono">#</span>
        <span class="mono">Name</span>
        <span class="mono">Email</span>
        <span class="mono">Seats</span>
        <span class="mono">Status</span>
        <span class="mono">Actions</span>
      </div>
      <div
        v-for="booking in bookings"
        :key="booking.id"
        class="table-row"
      >
        <span class="mono muted">{{ String(booking.id).padStart(2,'0') }}</span>
        <span>{{ booking.name }}</span>
        <span class="mono muted" style="font-size:0.78rem">{{ booking.email }}</span>
        <span class="mono">{{ booking.seats }}</span>
        <span><span class="tag" :class="booking.status === 'confirmed' ? 'green' : 'red'">{{ booking.status }}</span></span>
        <span class="row-actions">
          <router-link :to="`/bookings/${booking.id}`" class="btn" style="padding:0.4rem 0.8rem;font-size:0.65rem">View</router-link>
          <button class="btn danger" style="padding:0.4rem 0.8rem;font-size:0.65rem" @click="cancelBooking(booking.id)">Cancel</button>
        </span>
      </div>
    </div>

  </div>

  <div v-else-if="loading" class="loader">Loading event</div>
  <div v-else-if="error" class="error-msg">{{ error }}</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../api.js'

const route   = useRoute()
const id      = route.params.id

const event    = ref(null)
const seats    = ref(null)
const bookings = ref([])
const loading  = ref(true)
const error    = ref(null)

const showEdit  = ref(false)
const editError = ref(null)
const editing   = ref(false)
const editForm  = ref({})

const bookError   = ref(null)
const bookSuccess = ref(null)
const booking     = ref(false)
const bookForm    = ref({ name: '', email: '', seats: 1 })

const fillWidth = computed(() => {
  if (!seats.value) return '0%'
  const pct = (seats.value.booked_seats / seats.value.capacity) * 100
  return Math.min(pct, 100) + '%'
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const [e, s, b] = await Promise.all([
      api.getEvent(id),
      api.getSeatsLeft(id),
      api.getEventBookings(id),
    ])
    event.value = e
    seats.value = s
    bookings.value = b
    editForm.value = {
      name: e.name,
      location: e.location,
      event_date: toLocalInput(e.event_date),
      capacity: e.capacity,
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function submitEdit() {
  editError.value = null
  editing.value = true
  try {
    await api.updateEvent(id, {
      name: editForm.value.name,
      location: editForm.value.location,
      event_date: new Date(editForm.value.event_date).toISOString(),
      capacity: parseInt(editForm.value.capacity),
    })
    showEdit.value = false
    await load()
  } catch (e) {
    editError.value = e.message
  } finally {
    editing.value = false
  }
}

async function submitBooking() {
  bookError.value = null
  bookSuccess.value = null
  booking.value = true
  try {
    const b = await api.createBooking({
      event_id: parseInt(id),
      name: bookForm.value.name,
      email: bookForm.value.email,
      seats: parseInt(bookForm.value.seats),
    })
    bookSuccess.value = `Booking #${b.id} confirmed for ${b.name} — ${b.seats} seat(s).`
    bookForm.value = { name: '', email: '', seats: 1 }
    await load()
  } catch (e) {
    bookError.value = e.message
  } finally {
    booking.value = false
  }
}

async function cancelBooking(bookingId) {
  if (!confirm('Cancel this booking?')) return
  try {
    await api.cancelBooking(bookingId)
    await load()
  } catch (e) {
    alert(e.message)
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-BE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function toLocalInput(iso) {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(load)
</script>

<style scoped>
.event-detail { animation: fadeUp 0.4s ease both; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.back-link {
  display: inline-block;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  margin-bottom: 2rem;
  transition: color 0.2s;
}
.back-link:hover { color: var(--accent); }

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 3rem;
  margin-bottom: 2rem;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--muted);
  margin-top: 1rem;
}

.seats-block {
  text-align: right;
  min-width: 180px;
}

.seats-number {
  font-family: var(--font-display);
  font-size: 5rem;
  line-height: 1;
  color: var(--success);
  transition: color 0.3s;
}
.seats-number.low  { color: var(--accent); }
.seats-number.sold { color: var(--danger); }

.seats-label {
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-top: 0.25rem;
}

.seats-bar {
  height: 2px;
  background: var(--border);
  margin-top: 0.75rem;
  position: relative;
}
.seats-fill {
  position: absolute;
  left: 0; top: 0;
  height: 100%;
  background: var(--accent);
  transition: width 0.6s ease;
}

.section-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.section-label {
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--muted);
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 2rem;
  margin-bottom: 2rem;
}

.event-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

/* Bookings table */
.bookings-table {
  border: 1px solid var(--border);
}
.table-header, .table-row {
  display: grid;
  grid-template-columns: 50px 1fr 1.5fr 80px 120px 160px;
  gap: 1rem;
  padding: 0.85rem 1.25rem;
  align-items: center;
}
.table-header {
  border-bottom: 1px solid var(--border);
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--muted);
}
.table-row {
  border-bottom: 1px solid var(--border);
  font-size: 0.85rem;
  transition: background 0.15s;
}
.table-row:last-child { border-bottom: none; }
.table-row:hover { background: var(--surface); }

.row-actions { display: flex; gap: 0.5rem; }

.empty-state {
  padding: 2rem 0;
  font-size: 0.85rem;
}

/* Slide transition */
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.slide-enter-from, .slide-leave-to { opacity: 0; max-height: 0; padding: 0; }
.slide-enter-to, .slide-leave-from { max-height: 600px; }
</style>
