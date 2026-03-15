const BASE = '/api'

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(BASE + path, opts)
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Something went wrong')
  return data
}

export const api = {
  // Events
  getEvents:    ()         => request('GET',    '/events'),
  getEvent:     (id)       => request('GET',    `/events/${id}`),
  createEvent:  (body)     => request('POST',   '/events', body),
  updateEvent:  (id, body) => request('PUT',    `/events/${id}`, body),
  deleteEvent:  (id)       => request('DELETE', `/events/${id}`),
  getSeatsLeft: (id)       => request('GET',    `/events/${id}/seats-left`),
  getEventBookings: (id)   => request('GET',    `/events/${id}/bookings`),

  // Bookings
  createBooking: (body)    => request('POST',   '/bookings', body),
  getBooking:    (id)      => request('GET',    `/bookings/${id}`),
  cancelBooking: (id)      => request('PUT',    `/bookings/${id}/cancel`),
  deleteBooking: (id)      => request('DELETE', `/bookings/${id}`),
}
