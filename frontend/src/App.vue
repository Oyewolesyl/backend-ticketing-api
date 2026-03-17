<template>
  <div id="shell">
    <header class="site-header">
      <router-link to="/" class="logo">SYL<span class="dot">.</span>TICKETS</router-link>
      <nav>
        <router-link to="/">Events</router-link>
      </nav>
    </header>
    <main>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <footer class="site-footer">
      <span>SYL.TICKETS — Belgium's finest events</span>
    </footer>
  </div>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:       #0a0a0a;
  --surface:  #111111;
  --border:   #222222;
  --accent:   #e8ff47;
  --text:     #f0f0f0;
  --muted:    #555555;
  --danger:   #ff4747;
  --success:  #47ff8e;
  --font-display: 'Bebas Neue', sans-serif;
  --font-mono:    'DM Mono', monospace;
  --font-body:    'DM Sans', sans-serif;
}

html { font-size: 16px; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-weight: 300;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }

#shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ── HEADER ── */
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: rgba(10,10,10,0.92);
  backdrop-filter: blur(12px);
  z-index: 100;
  flex-wrap: wrap;
  gap: 0.75rem;
}

main {
  flex: 1;
  padding: 2rem 1.5rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.logo {
  font-family: var(--font-display);
  font-size: 1.6rem;
  letter-spacing: 0.08em;
  color: var(--text);
  transition: color 0.2s;
}
.logo:hover { color: var(--accent); }
.logo .dot { color: var(--accent); }

.site-header nav a {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--muted);
  transition: color 0.2s;
}
.site-header nav a:hover,
.site-header nav a.router-link-active { color: var(--accent); }

/* ── MAIN ── */
main {
  flex: 1;
  padding: 3rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

/* ── FOOTER ── */
.site-footer {
  padding: 1.5rem 3rem;
  border-top: 1px solid var(--border);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--muted);
  letter-spacing: 0.1em;
}

/* ── TRANSITIONS ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── SHARED COMPONENTS ── */
.page-title {
  font-family: var(--font-display);
  font-size: clamp(3rem, 8vw, 6rem);
  letter-spacing: 0.04em;
  line-height: 0.9;
  margin-bottom: 3rem;
}
.page-title span { color: var(--accent); }

.tag {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--border);
  color: var(--muted);
}
.tag.green { border-color: var(--success); color: var(--success); }
.tag.red   { border-color: var(--danger);  color: var(--danger); }
.tag.yellow{ border-color: var(--accent);  color: var(--accent); }

.btn {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s;
}
.btn:hover { border-color: var(--accent); color: var(--accent); }
.btn.primary { background: var(--accent); color: #000; border-color: var(--accent); }
.btn.primary:hover { background: transparent; color: var(--accent); }
.btn.danger { border-color: var(--danger); color: var(--danger); }
.btn.danger:hover { background: var(--danger); color: #000; }
.btn:disabled { opacity: 0.3; cursor: not-allowed; }

.input {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  padding: 0.75rem 1rem;
  outline: none;
  transition: border-color 0.2s;
  appearance: none;
}
.input:focus { border-color: var(--accent); }
.input::placeholder { color: var(--muted); }

.form-group { margin-bottom: 1.5rem; }
.form-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 0.5rem;
}

.error-msg {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--danger);
  padding: 1rem;
  border: 1px solid var(--danger);
  margin-bottom: 1.5rem;
}

.success-msg {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--success);
  padding: 1rem;
  border: 1px solid var(--success);
  margin-bottom: 1.5rem;
}

.mono { font-family: var(--font-mono); }
.muted { color: var(--muted); }

/* ── LOADING ── */
.loader {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--muted);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 4rem 0;
}
.loader::after {
  content: '';
  animation: dots 1.2s infinite;
}
@keyframes dots {
  0%   { content: '.'; }
  33%  { content: '..'; }
  66%  { content: '...'; }
}

/* ── DIVIDER ── */
.divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 2rem 0;
}

@media (max-width: 768px) {
  main {
    padding: 1.5rem 1rem;
  }

  .site-footer {
    padding: 1rem 1.5rem;
  }

  .page-title {
    font-size: clamp(2.5rem, 10vw, 4rem);
    margin-bottom: 1.5rem;
  }
}

</style>
