// app.js — calendar + mini login/register with profile + admin-link visibility
document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE = '/api';
  const calendarEl = document.getElementById('calendar');
  const availableList = document.getElementById('availableList');
  const loadingEl = document.getElementById('loading');
  const searchInput = document.getElementById('searchInput');
  const messageEl = document.getElementById('message');

  // header mini-panel elements
  const userIcon = document.getElementById('userIcon');
  const userPanel = document.getElementById('userPanel');
  const closeUserPanel = document.getElementById('closeUserPanel');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');

  const profileView = document.getElementById('profileView');
  const profileUsername = document.getElementById('profileUsername');
  const adminLink = document.getElementById('adminLink');
  const profileLogoutBtn = document.getElementById('profileLogoutBtn');

  const miniLoginForm = document.getElementById('miniLoginForm');
  const miniUsername = document.getElementById('miniUsername');
  const miniPassword = document.getElementById('miniPassword');
  const miniLoginBtn = document.getElementById('miniLoginBtn');
  const miniLoginMsg = document.getElementById('miniLoginMsg');

  const miniRegisterForm = document.getElementById('miniRegisterForm');
  const regUsername = document.getElementById('regUsername');
  const regPassword = document.getElementById('regPassword');
  const regPassword2 = document.getElementById('regPassword2');
  const regMobile = document.getElementById('regMobile');
  const miniRegisterBtn = document.getElementById('miniRegisterBtn');
  const miniRegisterMsg = document.getElementById('miniRegisterMsg');

  const welcomeMsgEl = document.getElementById('welcomeMsg');
  const logoutBtn = document.getElementById('logoutBtn');
  const navAdmin = document.getElementById('navAdmin');

  function getToken() { return localStorage.getItem('token') || localStorage.getItem('jwt'); }
  function setToken(t) { localStorage.setItem('token', t); }
  function clearToken() { localStorage.removeItem('token'); localStorage.removeItem('jwt'); }

  // panel open/close
  function openPanel() {
    renderPanelForAuth();
    userPanel.style.display = 'block';
    userPanel.setAttribute('aria-hidden', 'false');
    userIcon.setAttribute('aria-expanded', 'true');
  }
  function closePanel() {
    userPanel.style.display = 'none';
    userPanel.setAttribute('aria-hidden', 'true');
    userIcon.setAttribute('aria-expanded', 'false');
  }

  userIcon.addEventListener('click', (e) => {
    if (userPanel.style.display === 'block') closePanel(); else openPanel();
  });
  closeUserPanel.addEventListener('click', closePanel);
  document.addEventListener('click', (e) => {
    if (!userPanel.contains(e.target) && e.target !== userIcon) {
      if (userPanel.style.display === 'block') closePanel();
    }
  });

  // tabs
  function showLogin() {
    document.getElementById('panelTitle').textContent = 'Login';
    miniLoginForm.style.display = 'block';
    miniRegisterForm.style.display = 'none';
    profileView.style.display = 'none';
    tabLogin.classList.add('active'); tabRegister.classList.remove('active');
  }
  function showRegister() {
    document.getElementById('panelTitle').textContent = 'Register';
    miniLoginForm.style.display = 'none';
    miniRegisterForm.style.display = 'block';
    profileView.style.display = 'none';
    tabLogin.classList.remove('active'); tabRegister.classList.add('active');
  }
  tabLogin.addEventListener('click', () => { showLogin(); });
  tabRegister.addEventListener('click', () => { showRegister(); });

  function decodeJwt(token) {
    if (!token) return null;
    try {
      const part = token.split('.')[1];
      const padded = part + '='.repeat((4 - part.length % 4) % 4);
      return JSON.parse(atob(padded.replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) { return null; }
  }

  function renderPanelForAuth() {
    const token = getToken();
    const payload = decodeJwt(token);
    if (token && payload) {
      const username = (payload.username || payload.sub) || 'user';
      profileUsername.textContent = username;

      let isAdmin = false;
      if (payload.role && String(payload.role).toUpperCase().includes('ADMIN')) isAdmin = true;
      else if (Array.isArray(payload.roles) && payload.roles.some(r => String(r).toUpperCase().includes('ADMIN'))) isAdmin = true;
      else if (String(payload.authorities || payload.auth || '').toUpperCase().includes('ADMIN')) isAdmin = true;

      adminLink.style.display = isAdmin ? 'block' : 'none';
      navAdmin.style.display = isAdmin ? 'inline-block' : 'none';

      profileView.style.display = 'block';
      miniLoginForm.style.display = 'none';
      miniRegisterForm.style.display = 'none';
      tabLogin.style.display = 'none';
      tabRegister.style.display = 'none';
      document.getElementById('panelTitle').textContent = 'Account';
    } else {
      navAdmin.style.display = 'none';
      tabLogin.style.display = 'inline-block';
      tabRegister.style.display = 'inline-block';
      showLogin();
    }
    updateAuthUI();
  }

  function updateAuthUI() {
    const token = getToken();
    const payload = decodeJwt(token);
    let name = 'user';
    let isAdmin = false;
    if (payload) {
      name = (payload.username || payload.sub) || name;
      if (payload.role && String(payload.role).toUpperCase().includes('ADMIN')) isAdmin = true;
      else if (Array.isArray(payload.roles) && payload.roles.some(r => String(r).toUpperCase().includes('ADMIN'))) isAdmin = true;
    }
    if (token) {
      if (welcomeMsgEl) { welcomeMsgEl.textContent = `Welcome, ${name}`; welcomeMsgEl.style.display = 'inline-block'; }
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
      navAdmin.style.display = isAdmin ? 'inline-block' : 'none';
    } else {
      if (welcomeMsgEl) { welcomeMsgEl.textContent = ''; welcomeMsgEl.style.display = 'none'; }
      if (logoutBtn) logoutBtn.style.display = 'none';
      navAdmin.style.display = 'none';
    }
  }

  async function safeReadText(res) { try { return await res.text(); } catch (e) { return String(e); } }

  async function apiFetch(path, opts = {}) {
    const url = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
    const token = getToken();
    const headers = new Headers(opts.headers || {});
    headers.set('Accept', 'application/json');
    if (opts.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const finalOpts = Object.assign({}, opts, { headers });
    const res = await fetch(url, finalOpts);
    if (res.status === 401 || res.status === 403) throw new Error(`Auth error (${res.status}). Please login.`);
    if (!res.ok) { const txt = await safeReadText(res); throw new Error(`Request failed: ${res.status} ${res.statusText} - ${txt}`); }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return safeReadText(res);
  }

  // login
  miniLoginBtn.addEventListener('click', async () => {
    miniLoginMsg.textContent = '';
    const username = miniUsername.value?.trim();
    const password = miniPassword.value ?? '';
    if (!username || !password) { miniLoginMsg.textContent = 'Enter username and password'; return; }
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const body = await res.json();
      if (!res.ok) { miniLoginMsg.textContent = body.message || 'Login failed'; return; }
      if (!body.token) { miniLoginMsg.textContent = 'Login succeeded but token missing'; return; }
      setToken(body.token);
      updateAuthUI();
      renderPanelForAuth();
      setTimeout(() => closePanel(), 600);
      await fetchData();
    } catch (err) {
      console.error(err); miniLoginMsg.textContent = 'Login error: ' + (err.message || err);
    }
  });

  // register
  miniRegisterBtn.addEventListener('click', async () => {
    miniRegisterMsg.textContent = '';
    const username = regUsername.value?.trim();
    const password = regPassword.value ?? '';
    const password2 = regPassword2.value ?? '';
    const mobile = regMobile.value?.trim() || null;

    if (!username || !password) { miniRegisterMsg.textContent = 'Enter username and password'; return; }
    if (password !== password2) { miniRegisterMsg.textContent = 'Passwords do not match'; return; }
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, mobile })
      });
      const body = await res.json();
      if (!res.ok) { miniRegisterMsg.textContent = body.message || 'Register failed'; return; }
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const loginBody = await loginRes.json();
      if (loginRes.ok && loginBody.token) {
        setToken(loginBody.token);
        updateAuthUI();
        renderPanelForAuth();
        setTimeout(() => closePanel(), 600);
        await fetchData();
      } else {
        miniRegisterMsg.textContent = 'Registered. Please login.';
      }
    } catch (err) {
      console.error(err); miniRegisterMsg.textContent = 'Register error: ' + (err.message || err);
    }
  });

  profileLogoutBtn.addEventListener('click', async () => {
    clearToken(); updateAuthUI(); renderPanelForAuth(); closePanel(); await fetchData();
  });
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      clearToken(); updateAuthUI(); renderPanelForAuth(); await fetchData();
    });
  }

  // --- app data + calendar logic ---
  let cachedEvents = [];
  let cachedBookingCounts = {};

  async function fetchData() {
    if (loadingEl) { loadingEl.style.display = 'block'; loadingEl.textContent = 'Loading...'; }
    if (messageEl) messageEl.textContent = '';

    try {
      const events = await apiFetch('/events');
      cachedEvents = Array.isArray(events) ? events : [];

      let bookings = [];
      try {
        bookings = await apiFetch('/bookings');
        if (!Array.isArray(bookings)) bookings = [];
      } catch (bkErr) {
        console.warn('Bookings not loaded:', bkErr.message);
        if (messageEl) messageEl.textContent = 'Bookings not loaded: ' + bkErr.message;
        bookings = [];
      }

      const bookingCounts = {};
      bookings.forEach(b => {
        const eventId = (b && b.event && (b.event.id ?? b.eventId)) ?? (b && b.eventId) ?? null;
        if (eventId != null) bookingCounts[eventId] = (bookingCounts[eventId] || 0) + 1;
      });
      cachedBookingCounts = bookingCounts;

      const fcEvents = cachedEvents.map(e => ({ id: e.id, title: e.title || 'Untitled', start: e.date || e.start || null }));
      initCalendar(fcEvents);
      renderAvailableList(cachedEvents, cachedBookingCounts);
    } catch (err) {
      console.error('Failed to load events', err);
      if (loadingEl) { loadingEl.style.display = 'block'; loadingEl.textContent = `Failed to load data: ${err.message}`; }
      if (availableList) availableList.innerHTML = `<li class="muted">Failed to load data. ${escapeHtml(err.message)}</li>`;
    } finally {
      if (loadingEl && loadingEl.textContent && !loadingEl.textContent.toLowerCase().startsWith('failed')) loadingEl.style.display = 'none';
      else if (loadingEl && loadingEl.textContent && loadingEl.textContent.toLowerCase().startsWith('failed')) loadingEl.style.display = 'block';
      else if (loadingEl) loadingEl.style.display = 'none';
    }
  }

  function initCalendar(events) {
    if (!calendarEl) return;
    if (typeof FullCalendar === 'undefined' || !FullCalendar.Calendar) { console.warn('FullCalendar not loaded; skipping calendar init.'); return; }
    if (calendarEl._fcInstance) { try { calendarEl._fcInstance.destroy(); } catch (e) { } calendarEl._fcInstance = null; }
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' },
      events,
      eventClick: async function(info) {
        const evId = info.event.id;
        if (!confirm(`Book event "${info.event.title}"?`)) return;
        try {
          await apiFetch(`/bookings/book/${evId}`, { method: 'POST' });
          alert('Booked successfully');
          await fetchData();
        } catch (err) {
          alert('Booking failed: ' + err.message);
        }
      }
    });
    calendar.render();
    calendarEl._fcInstance = calendar;
  }

  function renderAvailableList(events, bookingCounts, filter = '') {
    if (!availableList) return;
    const q = (filter || '').trim().toLowerCase();
    const filtered = (Array.isArray(events) ? events : []).filter(e =>
      !q || (e.title || '').toLowerCase().includes(q) || String(e.date || '').includes(q) || (e.location || '').toLowerCase().includes(q)
    );

    availableList.innerHTML = '';
    if (!filtered.length) {
      availableList.innerHTML = '<li class="muted">No events match.</li>';
      return;
    }

    filtered.forEach(e => {
      const booked = bookingCounts[e.id] || 0;
      const remaining = Math.max((e.capacity || 0) - booked, 0);

      const li = document.createElement('li');
      li.className = 'event-item';
      li.innerHTML = `
        <div class="event-main">
          <div class="event-title">${escapeHtml(e.title || 'Untitled')}</div>
          <div class="event-meta">${escapeHtml(e.date || '')} • Capacity: ${e.capacity || 0} • Booked: ${booked}</div>
        </div>
        <div class="event-right" style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
          <div class="${remaining > 0 ? 'badge available' : 'badge full'}">${remaining > 0 ? remaining + ' left' : 'Full'}</div>
        </div>
      `;

      const right = li.querySelector('.event-right');
      if (remaining > 0) {
        const btn = document.createElement('button');
        btn.className = 'btn small';
        btn.style.marginLeft = '8px';
        btn.textContent = 'Book';
        btn.onclick = async () => {
          try {
            await apiFetch(`/bookings/book/${e.id}`, { method: 'POST' });
            alert('Booked successfully');
            await fetchData();
          } catch (err) {
            alert('Booking failed: ' + err.message);
          }
        };
        right.appendChild(btn);
      }

      availableList.appendChild(li);
    });
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      try {
        renderAvailableList(cachedEvents, cachedBookingCounts, searchInput.value || '');
        // toggle clear button
        const clearBtn = document.getElementById('clearSearch');
        if (clearBtn) clearBtn.style.display = searchInput.value ? 'inline-flex' : 'none';
      } catch (e) {
        console.warn('search update error', e);
      }
    });
  }

  // search debounce & clear
  (function() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');

    function debounce(fn, wait = 200) {
      let t;
      return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
    }

    function doFilter(v) { renderAvailableList(cachedEvents, cachedBookingCounts, v); }

    const debounced = debounce(v => doFilter(v), 220);

    if (input) {
      input.addEventListener('input', (e) => {
        const v = e.target.value;
        if (clearBtn) clearBtn.style.display = v ? 'inline-flex' : 'none';
        debounced(v);
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (input) input.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
        doFilter('');
        if (input) input.focus();
      });
    }
  })();

  // initialize header UI and app data
  updateAuthUI();
  renderPanelForAuth();
  await fetchData();
});