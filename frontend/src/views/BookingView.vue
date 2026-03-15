<template>
  <div class="booking-detail" v-if="booking">

    <router-link :to="`/events/${booking.event_id}`" class="back-link mono muted">← Back to Event</router-link>

    <div class="booking-header">
      <div>
        <span class="tag mono">Booking {{ String(booking.id).padStart(2,'0') }}</span>
        <h1 class="page-title" style="margin-top:1rem">
          {{ booking.name }}<span>.</span>
        </h1>
        <p class="mono muted" style="font-size:0.85rem; margin-top:0.5rem">{{ booking.email }}</p>
      </div>
      <div class="status-block">
        <span class="status-badge" :class="booking.status">{{ booking.status }}</span>
      </div>
    </div>

    <hr class="divider" />

    <!-- Booking details -->
    <div class="detail-grid">
      <div class="detail-item">
        <span class="form-label">Seats Booked</span>
        <span class="detail-value">{{ booking.seats }}</span>
      </div>
      <div class="detail-item">
        <span class="form-label">Status</span>
        <span class="tag" :class="booking.status === 'confirmed' ? 'green' : 'red'">{{ booking.status }}</span>
      </div>
      <div class="detail-item">
        <span class="form-label">Booked On</span>
        <span class="mono" style="font-size:0.85rem">{{ formatDate(booking.created_at) }}</span>
      </div>
      <div class="detail-item">
        <span class="form-label">Last Updated</span>
        <span class="mono" style="font-size:0.85rem">{{ formatDate(booking.updated_at) }}</span>
      </div>
    </div>

    <hr class="divider" />

    <!-- Event details -->
    <div class="section-row">
      <span class="section-label mono">Event</span>
    </div>

    <div class="event-block" v-if="booking.event">
      <div class="event-block-name">{{ booking.event.name }}</div>
      <div class="event-block-meta mono muted">
        <span>📍 {{ booking.event.location }}</span>
        <span>🗓 {{ formatDate(booking.event.event_date) }}</span>
        <span>Cap. {{ booking.event.capacity }}</span>
      </div>
      <router-link :to="`/events/${booking.event.id}`" class="btn" style="margin-top:1rem">View Event</router-link>
    </div>

    <hr class="divider" />

    <!-- Actions -->
    <div class="actions-row">
      <div class="error-msg" v-if="actionError">{{ actionError }}</div>
      <div class="success-msg" v-if="actionSuccess">{{ actionSuccess }}</div>
      <div class="action-buttons">
        <button
          class="btn danger"
          @click="cancel"
          :disabled="booking.status === 'cancelled' || acting"
        >
          {{ booking.status === 'cancelled' ? 'Already Cancelled' : 'Cancel Booking' }}
        </button>
        <button class="btn danger" @click="remove" :disabled="acting">
          Delete Booking
        </button>
      </div>
    </div>

  </div>

  <div v-else-if="loading" class="loader">Loading booking</div>
  <div v-else-if="error" class="error-msg">{{ error }}</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api.js'

const route  = useRoute()
const router = useRouter()
const id     = route.params.id

const booking      = ref(null)
const loading      = ref(true)
const error        = ref(null)
const acting       = ref(false)
const actionError  = ref(null)
const actionSuccess = ref(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    booking.value = await api.getBooking(id)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function cancel() {
  if (!confirm('Cancel this booking?')) return
  acting.value = true
  actionError.value = null
  try {
    booking.value = await api.cancelBooking(id)
    actionSuccess.value = 'Booking cancelled successfully.'
  } catch (e) {
    actionError.value = e.message
  } finally {
    acting.value = false
  }
}

async function remove() {
  if (!confirm('Permanently delete this booking?')) return
  acting.value = true
  actionError.value = null
  try {
    await api.deleteBooking(id)
    router.push('/')
  } catch (e) {
    actionError.value = e.message
    acting.value = false
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-BE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

onMounted(load)
</script>

<style scoped>
.booking-detail { animation: fadeUp 0.4s ease both; }

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

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.status-badge {
  font-family: var(--font-display);
  font-size: 2.5rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.status-badge.confirmed { color: var(--success); }
.status-badge.cancelled { color: var(--danger); }

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-value {
  font-family: var(--font-display);
  font-size: 3rem;
  line-height: 1;
  color: var(--accent);
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

.event-block {
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 2rem;
  margin-bottom: 2rem;
}
.event-block-name {
  font-family: var(--font-display);
  font-size: 2rem;
  letter-spacing: 0.04em;
  margin-bottom: 0.75rem;
}
.event-block-meta {
  display: flex;
  gap: 2rem;
  font-size: 0.8rem;
}

.actions-row { margin-top: 1rem; }
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}
</style>
