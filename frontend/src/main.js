import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import EventsView from './views/EventsView.vue'
import EventDetailView from './views/EventDetailView.vue'
import BookingView from './views/BookingView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: EventsView },
    { path: '/events/:id', component: EventDetailView },
    { path: '/bookings/:id', component: BookingView },
  ]
})

createApp(App).use(router).mount('#app')
