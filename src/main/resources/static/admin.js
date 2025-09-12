// admin.js — admin UI (create/delete events + load bookings) with Authorization header
const API_BASE = '/api';

// When replacing this file make sure your browser has a valid token in localStorage.token or localStorage.jwt
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('createEventForm');
  const clearBtn = document.getElementById('clearForm');
  const createMsg = document.getElementById('createMsg');
  const refreshBtn = document.getElementById('refreshBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    createMsg.textContent = '';

    const payload = {
      title: document.getElementById('title').value.trim(),
      description: document.getElementById('description').value.trim(),
      date: document.getElementById('date').value,
      capacity: parseInt(document.getElementById('capacity').value, 10)
    };

    try {
      const res = await fetchWithAuth(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const txt = await safeReadText(res);
        throw new Error(txt || 'Failed to create event');
      }

      const created = await res.json();
      createMsg.style.color = 'green';
      createMsg.textContent = `Created event: ${created.title} (id: ${created.id})`;
      form.reset();
      await loadEvents();
      await loadBookings();
    } catch (err) {
      console.error(err);
      createMsg.style.color = '#b91c1c';
      createMsg.textContent = 'Error: ' + err.message;
      alert('Create failed: ' + err.message);
    }
  });

  clearBtn.addEventListener('click', () => form.reset());
  refreshBtn.addEventListener('click', () => { loadEvents(); loadBookings(); });

  // initial load
  loadEvents();
  loadBookings();
});

// --- auth helpers ---
function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('jwt') || '';
}

function authHeaders(additional = {}) {
  const headers = Object.assign({}, additional || {});
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return headers;
}

async function fetchWithAuth(url, opts = {}) {
  const headers = Object.assign({}, opts.headers || {}, authHeaders());
  const finalOpts = Object.assign({}, opts, { headers });
  return fetch(url, finalOpts);
}

async function safeReadText(res) {
  try { return await res.text(); } catch (e) { return String(e); }
}

// --- Events / Bookings loading ---
async function loadEvents() {
  const tbody = document.querySelector('#eventsTable tbody');
  tbody.innerHTML = '<tr><td colspan="4" class="muted">Loading...</td></tr>';
  try {
    const res = await fetch('/api/events');
    if (!res.ok) throw new Error('Failed to fetch events: ' + res.status);
    const events = await res.json();
    if (!Array.isArray(events) || events.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="muted">No events found</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    events.forEach(ev => {
      const tr = document.createElement('tr');

      const titleTd = document.createElement('td'); titleTd.textContent = ev.title;
      const dateTd  = document.createElement('td'); dateTd.textContent = ev.date;
      const capTd   = document.createElement('td'); capTd.textContent = ev.capacity;
      const actionsTd = document.createElement('td');

      // Delete button
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.className = 'danger small';
      delBtn.onclick = async () => {
        if (!confirm(`Delete event "${ev.title}"? This will remove related bookings.`)) return;
        try {
          const resp = await fetchWithAuth(`/api/events/${ev.id}`, { method: 'DELETE' });
          if (resp.status === 401 || resp.status === 403) {
            const txt = await safeReadText(resp);
            throw new Error('Not authorized: ' + (txt || resp.statusText));
          }
          if (!resp.ok) {
            const txt = await safeReadText(resp);
            throw new Error(txt || 'Failed to delete');
          }
          await loadEvents();
          await loadBookings();
        } catch (e) {
          alert('Delete failed: ' + e.message);
        }
      };

      actionsTd.appendChild(delBtn);

      tr.appendChild(titleTd);
      tr.appendChild(dateTd);
      tr.appendChild(capTd);
      tr.appendChild(actionsTd);
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="muted">Error loading events: ${err.message}</td></tr>`;
  }
}

async function loadBookings() {
  const tbody = document.querySelector('#bookingsTable tbody');
  tbody.innerHTML = '<tr><td colspan="4" class="muted">Loading...</td></tr>';
  try {
    // <-- use fetchWithAuth so JWT is included -->
    const res = await fetchWithAuth('/api/bookings', { method: 'GET' });

    if (res.status === 401 || res.status === 403) {
      // not authorized to see bookings
      const txt = await safeReadText(res);
      tbody.innerHTML = `<tr><td colspan="4" class="muted">Bookings not available: ${escapeHtml(txt || res.statusText)}</td></tr>`;
      return;
    }

    if (!res.ok) {
      const txt = await safeReadText(res);
      throw new Error(txt || 'Failed to fetch bookings');
    }

    const bookings = await res.json();
    if (!Array.isArray(bookings) || bookings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="muted">No bookings found</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    bookings.forEach(b => {
      const tr = document.createElement('tr');

      const userTd = document.createElement('td');
      userTd.textContent = b.user ? b.user.username || (`id:${b.user.id}`) : ('user_id:' + (b.user?.id || 'N/A'));

      const eventTd = document.createElement('td');
      eventTd.textContent = b.event ? b.event.title || (`id:${b.event.id}`) : ('event_id:' + (b.event?.id || 'N/A'));

      const qrTd = document.createElement('td');
      const qrPath = b.qrCodePath || '';
      if (qrPath) {
        const a = document.createElement('a');
        a.href = '/' + qrPath;
        a.target = '_blank';
        a.textContent = qrPath;
        qrTd.appendChild(a);
      } else {
        qrTd.textContent = '—';
      }

      const actionsTd = document.createElement('td');
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.className = 'danger small';
      cancelBtn.onclick = async () => {
        if (!confirm('Cancel this booking?')) return;
        try {
          const resp = await fetchWithAuth(`/api/bookings/${b.id}`, { method: 'DELETE' });
          if (resp.status === 401 || resp.status === 403) {
            const txt = await safeReadText(resp);
            throw new Error('Not authorized: ' + (txt || resp.statusText));
          }
          if (!resp.ok) {
            const txt = await safeReadText(resp);
            throw new Error(txt || 'Failed to cancel booking');
          }
          await loadBookings();
        } catch (err) {
          alert('Cancel failed: ' + err.message);
        }
      };

      actionsTd.appendChild(cancelBtn);

      tr.appendChild(userTd);
      tr.appendChild(eventTd);
      tr.appendChild(qrTd);
      tr.appendChild(actionsTd);
      tbody.appendChild(tr);
    });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="muted">Error loading bookings: ${escapeHtml(err.message)}</td></tr>`;
  }
}

// small helper
function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}