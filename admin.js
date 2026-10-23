/**
 * Lumina Skin Clinic — Admin Router Module
 * Exports a factory function (getDb, config) returning an Express router.
 * Mounted at /admin by index.js.
 * Fully self-contained: HTML/CSS/JS UI + JSON API + CSV export.
 * Follows 80:15:5 design system, HMAC session auth, and timing-safe checks.
 */

const express = require('express');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');

// In-memory rate limiting for login attempts: ip -> { attempts, lockedUntil }
const loginRateLimit = new Map();

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1'
  );
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const key = parts.shift().trim();
      if (key) {
        list[key] = decodeURIComponent(parts.join('='));
      }
    });
  }
  return list;
}

function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

module.exports = function createAdminRouter(getDb, config) {
  const router = express.Router();
  router.use(express.urlencoded({ extended: true }));
  router.use(express.json());

  const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'lumina2026';
  // Secret derived for HMAC signature
  const HMAC_SECRET = crypto
    .createHash('sha256')
    .update(ADMIN_PASS + (process.env.MONGODB_URI || 'lumina-secret'))
    .digest('hex');

  function signSession(payload) {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', HMAC_SECRET).update(data).digest('base64url');
    return `${data}.${sig}`;
  }

  function verifySession(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', HMAC_SECRET).update(data).digest('base64url');
    if (!timingSafeEqualStr(sig, expectedSig)) return null;
    try {
      const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
      if (payload.exp && Date.now() > payload.exp) return null;
      return payload;
    } catch {
      return null;
    }
  }

  // Auth Guard Middleware
  function requireAuth(req, res, next) {
    const cookies = parseCookies(req);
    const session = verifySession(cookies.admin_session);
    if (!session || session.user !== ADMIN_USER) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return res.redirect('/admin/login');
    }
    req.adminUser = session.user;
    next();
  }

  // Rate Limiting Middleware for Login
  function checkLoginRateLimit(req, res, next) {
    const ip = getClientIp(req);
    const now = Date.now();
    const entry = loginRateLimit.get(ip);

    if (entry && entry.lockedUntil > now) {
      const waitMinutes = Math.ceil((entry.lockedUntil - now) / 60000);
      return res.status(429).send(
        renderLoginPage(
          `Too many failed login attempts. Please wait ${waitMinutes} minute(s) before trying again.`,
          config
        )
      );
    }
    next();
  }

  function recordLoginFailure(ip) {
    const now = Date.now();
    const entry = loginRateLimit.get(ip) || { attempts: 0, lockedUntil: 0 };
    entry.attempts += 1;
    if (entry.attempts >= 5) {
      entry.lockedUntil = now + 15 * 60 * 1000; // 15 mins lock
      entry.attempts = 0;
    }
    loginRateLimit.set(ip, entry);
  }

  function clearLoginFailure(ip) {
    loginRateLimit.delete(ip);
  }

  // 1. GET /admin/login
  router.get('/login', (req, res) => {
    const cookies = parseCookies(req);
    if (verifySession(cookies.admin_session)) {
      return res.redirect('/admin');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderLoginPage(null, config));
  });

  // 2. POST /admin/login
  router.post('/login', checkLoginRateLimit, (req, res) => {
    const ip = getClientIp(req);
    const { username, password } = req.body;

    const userValid = timingSafeEqualStr(username || '', ADMIN_USER);
    const passValid = timingSafeEqualStr(password || '', ADMIN_PASS);

    if (!userValid || !passValid) {
      recordLoginFailure(ip);
      return res
        .status(401)
        .send(renderLoginPage('Invalid administrator credentials.', config));
    }

    clearLoginFailure(ip);
    const sessionToken = signSession({
      user: ADMIN_USER,
      iat: Date.now(),
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    res.setHeader(
      'Set-Cookie',
      `admin_session=${encodeURIComponent(sessionToken)}; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=86400`
    );
    res.redirect('/admin');
  });

  // 3. GET/POST /admin/logout
  router.all('/logout', (req, res) => {
    res.setHeader(
      'Set-Cookie',
      'admin_session=; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=0'
    );
    res.redirect('/admin/login');
  });

  // Helper to get bookings collection safely
  async function getBookingsCol() {
    const db = await getDb();
    if (!db) return null;
    return db.collection('bookings');
  }

  // 4. GET /admin (Dashboard)
  router.get('/', requireAuth, async (req, res) => {
    try {
      const col = await getBookingsCol();
      let bookings = [];
      if (col) {
        bookings = await col.find({}).sort({ createdAt: -1 }).toArray();
      }

      // Compute status counts
      const total = bookings.length;
      let pending = 0;
      let confirmed = 0;
      let completed = 0;
      let cancelled = 0;
      let todayCount = 0;
      let upcomingCount = 0;

      const todayStr = new Date().toISOString().split('T')[0];

      bookings.forEach((b) => {
        if (b.status === 'pending') pending++;
        else if (b.status === 'confirmed') confirmed++;
        else if (b.status === 'completed') completed++;
        else if (b.status === 'cancelled') cancelled++;

        if (b.date === todayStr && b.status !== 'cancelled') {
          todayCount++;
        }
        if (b.date > todayStr && b.status !== 'cancelled') {
          upcomingCount++;
        }
      });

      const counts = {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
        today: todayCount,
        upcoming: upcomingCount,
      };

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(renderDashboard(bookings, counts, config));
    } catch (err) {
      console.error('Error fetching admin bookings:', err);
      res.status(500).send('Error loading dashboard');
    }
  });

  // 5. POST /admin/bookings/:id/status
  router.post('/bookings/:id/status', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const col = await getBookingsCol();
      if (!col) {
        return res.status(500).json({ error: 'Database unavailable' });
      }

      let filter;
      try {
        filter = { _id: new ObjectId(id) };
      } catch {
        filter = { _id: id };
      }

      await col.updateOne(
        filter,
        { $set: { status, updatedAt: new Date().toISOString() } }
      );

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, status });
      }
      res.redirect('/admin');
    } catch (err) {
      console.error('Error updating status:', err);
      res.status(500).json({ error: 'Failed to update booking status' });
    }
  });

  // 6. DELETE /admin/bookings/:id
  router.post('/bookings/:id/delete', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const col = await getBookingsCol();
      if (!col) {
        return res.status(500).json({ error: 'Database unavailable' });
      }

      let filter;
      try {
        filter = { _id: new ObjectId(id) };
      } catch {
        filter = { _id: id };
      }

      await col.deleteOne(filter);

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true });
      }
      res.redirect('/admin');
    } catch (err) {
      console.error('Error deleting booking:', err);
      res.status(500).json({ error: 'Failed to delete booking' });
    }
  });

  // 7. GET /admin/export.csv
  router.get('/export.csv', requireAuth, async (req, res) => {
    try {
      const col = await getBookingsCol();
      let bookings = [];
      if (col) {
        bookings = await col.find({}).sort({ createdAt: -1 }).toArray();
      }

      const headers = [
        'Booking Ref',
        'Date Booked',
        'Appointment Date',
        'Time Slot',
        'Client Name',
        'Phone',
        'Email',
        'Treatment Service',
        'Price',
        'Status',
        'Client Notes',
      ];

      const rows = bookings.map((b) => [
        escapeCsv(b.bookingRef || b._id),
        escapeCsv(b.createdAt ? b.createdAt.substring(0, 10) : ''),
        escapeCsv(b.date || ''),
        escapeCsv(b.timeSlot || ''),
        escapeCsv(b.clientName || ''),
        escapeCsv(b.clientPhone || ''),
        escapeCsv(b.clientEmail || ''),
        escapeCsv(b.serviceTitle || ''),
        escapeCsv(b.price || ''),
        escapeCsv(b.status || 'pending'),
        escapeCsv(b.notes || ''),
      ]);

      const csvContent =
        headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');

      const filename = `lumina-bookings-${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      );
      res.send(csvContent);
    } catch (err) {
      console.error('Error generating CSV export:', err);
      res.status(500).send('Failed to generate CSV export');
    }
  });

  return router;
};

// ==========================================
// INLINE ADMIN UI TEMPLATES (80:15:5 Design)
// ==========================================

function getAdminStyles() {
  return `
    :root {
      --bg-cream: #FAF8F5;
      --bg-surface: #FFFFFF;
      --color-sage: #6B8E7D;
      --color-sage-soft: #F0F4F1;
      --color-blush: #F7EBE8;
      --color-sand: #EFE8DE;
      --text-main: #2D3748;
      --text-muted: #718096;
      --border-subtle: rgba(0, 0, 0, 0.08);
      --glass-bg: rgba(255, 255, 255, 0.88);
      --glass-border: rgba(255, 255, 255, 0.6);
      --clay-shadow: 0 4px 10px rgba(107, 142, 125, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.7);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-cream);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      line-height: 1.5;
    }
    h1, h2, h3 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .clay-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: var(--color-sage);
      color: #FFFFFF;
      font-weight: 600;
      font-size: 0.875rem;
      padding: 0.65rem 1.25rem;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.3);
      box-shadow: var(--clay-shadow);
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease-out;
      white-space: nowrap;
    }
    .clay-btn:hover {
      background: #5A7B6B;
      transform: translateY(-1px);
    }
    .clay-btn:active {
      transform: scale(0.97);
    }
    .clay-btn-secondary {
      background: #FFFFFF;
      color: var(--text-main);
      border: 1px solid var(--border-subtle);
      box-shadow: 0 2px 6px rgba(0,0,0,0.04), inset 0 1px 0 #FFF;
    }
    .clay-btn-secondary:hover {
      background: var(--color-sage-soft);
      color: var(--color-sage);
    }
    .glass-card {
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }
    .tabular { font-variant-numeric: tabular-nums; }
  `;
}

function renderLoginPage(errorMessage, config) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login — ${escapeHtml(config.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    ${getAdminStyles()}
    .login-container {
      max-width: 420px;
      margin: auto;
      padding: 2.5rem;
      width: 100%;
    }
    .form-group {
      margin-bottom: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-group label {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-muted);
    }
    .form-group input {
      padding: 0.75rem 1rem;
      border-radius: 12px;
      border: 1px solid var(--border-subtle);
      background: #FFFFFF;
      font-size: 0.95rem;
      color: var(--text-main);
      outline: none;
      transition: border-color 0.2s;
    }
    .form-group input:focus {
      border-color: var(--color-sage);
      box-shadow: 0 0 0 3px rgba(107, 142, 125, 0.15);
    }
    .error-banner {
      background: #FFF5F5;
      border: 1px solid #FEB2B2;
      color: #C53030;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      font-size: 0.85rem;
      margin-bottom: 1.25rem;
    }
  </style>
</head>
<body style="align-items: center; justify-content: center; padding: 1.5rem;">
  <div class="glass-card login-container">
    <div style="text-align: center; margin-bottom: 2rem;">
      <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--color-sage); font-weight: 600;">Clinic Portal</span>
      <h1 style="font-size: 2rem; margin-top: 0.25rem; color: var(--text-main);">${escapeHtml(config.name)}</h1>
      <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.35rem;">Manage appointments and bookings</p>
    </div>

    ${errorMessage ? `<div class="error-banner">${escapeHtml(errorMessage)}</div>` : ''}

    <form method="POST" action="/admin/login">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required autocomplete="username" autofocus>
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required autocomplete="current-password">
      </div>

      <button type="submit" class="clay-btn" style="width: 100%; margin-top: 0.5rem; padding: 0.85rem;">
        Sign In to Dashboard
      </button>
    </form>

    <div style="text-align: center; margin-top: 1.75rem;">
      <a href="/" style="font-size: 0.85rem; color: var(--text-muted); text-decoration: none;">&larr; Back to public site</a>
    </div>
  </div>
</body>
</html>`;
}

function renderDashboard(bookings, counts, config) {
  const priceFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: config.currency || 'USD',
    maximumFractionDigits: 0,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard — ${escapeHtml(config.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    ${getAdminStyles()}
    .admin-header {
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-subtle);
      padding: 1rem 2rem;
      position: sticky;
      top: 0;
      z-index: 40;
    }
    .header-inner {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .main-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem;
      width: 100%;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .kpi-card {
      padding: 1.25rem;
      border-radius: 14px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
    }
    .kpi-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 600;
    }
    .kpi-val {
      font-size: 1.85rem;
      font-weight: 700;
      color: var(--text-main);
      margin-top: 0.35rem;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }
    .filters-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }
    .search-input, .filter-select, .date-input {
      padding: 0.6rem 0.9rem;
      border-radius: 12px;
      border: 1px solid var(--border-subtle);
      background: #FFFFFF;
      font-size: 0.875rem;
      color: var(--text-main);
      outline: none;
    }
    .search-input:focus, .filter-select:focus, .date-input:focus {
      border-color: var(--color-sage);
    }
    .table-container {
      overflow-x: auto;
      background: #FFFFFF;
      border-radius: 16px;
      border: 1px solid var(--border-subtle);
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }
    th {
      background: var(--bg-cream);
      padding: 1rem;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-subtle);
      white-space: nowrap;
    }
    td {
      padding: 1rem;
      border-bottom: 1px solid var(--border-subtle);
      vertical-align: middle;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(240, 244, 241, 0.4); }
    .badge-status {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: capitalize;
    }
    .status-pending { background: #FEF3C7; color: #92400E; }
    .status-confirmed { background: #DEF7EC; color: #03543F; }
    .status-completed { background: #E1EFFE; color: #1E429F; }
    .status-cancelled { background: #FDE8E8; color: #9B1C1C; }
    .action-btn {
      padding: 0.4rem 0.75rem;
      font-size: 0.75rem;
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
      background: #FFFFFF;
      cursor: pointer;
      transition: all 0.15s;
    }
    .action-btn:hover {
      background: var(--color-sage-soft);
      border-color: var(--color-sage);
      color: var(--color-sage);
    }
    .empty-state {
      padding: 4rem 2rem;
      text-align: center;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <header class="admin-header">
    <div class="header-inner">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <h2 style="font-size: 1.5rem; color: var(--text-main);">${escapeHtml(config.name)}</h2>
        <span style="font-size: 0.75rem; background: var(--color-sage-soft); color: var(--color-sage); padding: 0.25rem 0.6rem; border-radius: 6px; font-weight: 600;">Admin Dashboard</span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <a href="/" target="_blank" class="clay-btn clay-btn-secondary" style="font-size: 0.8rem; padding: 0.5rem 0.9rem;">
          View Public Site &rarr;
        </a>
        <a href="/admin/export.csv" class="clay-btn clay-btn-secondary" style="font-size: 0.8rem; padding: 0.5rem 0.9rem;">
          Export CSV
        </a>
        <a href="/admin/logout" class="clay-btn" style="background: #E53E3E; font-size: 0.8rem; padding: 0.5rem 0.9rem; box-shadow: none;">
          Sign Out
        </a>
      </div>
    </div>
  </header>

  <main class="main-content">
    <!-- Top KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Total Bookings</div>
        <div class="kpi-val tabular">${counts.total}</div>
      </div>
      <div class="kpi-card" style="border-left: 3px solid var(--color-sage);">
        <div class="kpi-label">Today's Visits</div>
        <div class="kpi-val tabular" style="color: var(--color-sage);">${counts.today}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Pending Action</div>
        <div class="kpi-val tabular" style="color: #D97706;">${counts.pending}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Confirmed</div>
        <div class="kpi-val tabular" style="color: #059669;">${counts.confirmed}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Completed</div>
        <div class="kpi-val tabular" style="color: #2563EB;">${counts.completed}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Cancelled</div>
        <div class="kpi-val tabular" style="color: #DC2626;">${counts.cancelled}</div>
      </div>
    </div>

    <!-- Toolbar: Search & Filters -->
    <div class="toolbar">
      <div class="filters-group">
        <input type="text" id="searchInput" class="search-input" placeholder="Search client, email, ref..." style="min-width: 240px;">
        <select id="statusFilter" class="filter-select">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input type="date" id="dateFilter" class="date-input" title="Filter by date">
        <button id="resetFiltersBtn" class="action-btn" style="display: none;">Reset Filters</button>
      </div>
      <div style="font-size: 0.85rem; color: var(--text-muted);">
        Showing <span id="visibleCount" class="tabular" style="font-weight: 600; color: var(--text-main);">${bookings.length}</span> appointments
      </div>
    </div>

    <!-- Bookings Table -->
    <div class="table-container">
      <table id="bookingsTable">
        <thead>
          <tr>
            <th>Ref & Created</th>
            <th>Client Details</th>
            <th>Treatment</th>
            <th>Date & Slot</th>
            <th>Status</th>
            <th>Notes</th>
            <th style="text-align: right;">Update Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            bookings.length === 0
              ? `<tr><td colspan="7" class="empty-state">No appointments recorded yet. New bookings from the public site will appear here automatically.</td></tr>`
              : bookings
                  .map((b) => {
                    const status = b.status || 'pending';
                    const idStr = String(b._id);
                    const phoneClean = (b.clientPhone || '').replace(/[^0-9+]/g, '');
                    const waLink = phoneClean
                      ? `https://wa.me/${phoneClean.replace('+', '')}?text=${encodeURIComponent(`Hi ${b.clientName || 'there'}, this is ${config.name} regarding your appointment on ${b.date} at ${b.timeSlot}.`)}`
                      : '#';

                    return `
                    <tr data-ref="${escapeHtml(b.bookingRef || idStr).toLowerCase()}"
                        data-client="${escapeHtml(b.clientName || '').toLowerCase()}"
                        data-phone="${escapeHtml(b.clientPhone || '').toLowerCase()}"
                        data-email="${escapeHtml(b.clientEmail || '').toLowerCase()}"
                        data-status="${escapeHtml(status)}"
                        data-date="${escapeHtml(b.date || '')}">
                      <td>
                        <div style="font-weight: 600; font-family: monospace; font-size: 0.85rem; color: var(--color-sage);">
                          ${escapeHtml(b.bookingRef || idStr.substring(0, 8))}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                          ${b.createdAt ? escapeHtml(b.createdAt.substring(0, 10)) : ''}
                        </div>
                      </td>
                      <td>
                        <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(b.clientName)}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 0.5rem; align-items: center; margin-top: 2px;">
                          <span>${escapeHtml(b.clientPhone)}</span>
                          ${
                            phoneClean
                              ? `<a href="${waLink}" target="_blank" title="WhatsApp client" style="color: #059669; text-decoration: none; font-size: 0.75rem; font-weight: 600;">(WhatsApp)</a>`
                              : ''
                          }
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(b.clientEmail)}</div>
                      </td>
                      <td>
                        <div style="font-weight: 500;">${escapeHtml(b.serviceTitle)}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;" class="tabular">
                          ${b.price ? priceFormatter.format(b.price) : ''}
                        </div>
                      </td>
                      <td>
                        <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(b.date)}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">${escapeHtml(b.timeSlot)}</div>
                      </td>
                      <td>
                        <span class="badge-status status-${escapeHtml(status)}">${escapeHtml(status)}</span>
                      </td>
                      <td style="max-width: 220px;">
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(b.notes || '—')}</span>
                      </td>
                      <td style="text-align: right; white-space: nowrap;">
                        <form method="POST" action="/admin/bookings/${idStr}/status" style="display: inline-block;">
                          <select name="status" onchange="this.form.submit()" class="filter-select" style="padding: 0.35rem 0.6rem; font-size: 0.8rem;">
                            <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>Confirm</option>
                            <option value="completed" ${status === 'completed' ? 'selected' : ''}>Complete</option>
                            <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>Cancel</option>
                          </select>
                        </form>
                        <form method="POST" action="/admin/bookings/${idStr}/delete" style="display: inline-block; margin-left: 0.35rem;" onsubmit="return confirm('Are you sure you want to permanently delete this booking?');">
                          <button type="submit" class="action-btn" title="Delete record" style="color: #DC2626; border-color: #FECACA;">&times;</button>
                        </form>
                      </td>
                    </tr>`;
                  })
                  .join('')
          }
        </tbody>
      </table>
    </div>
  </main>

  <script>
    // Client-side instant filter and search
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const resetBtn = document.getElementById('resetFiltersBtn');
    const table = document.getElementById('bookingsTable');
    const visibleCount = document.getElementById('visibleCount');

    function applyFilters() {
      const query = (searchInput.value || '').trim().toLowerCase();
      const status = statusFilter.value;
      const date = dateFilter.value;
      const rows = table.querySelectorAll('tbody tr[data-status]');

      let visible = 0;
      rows.forEach(row => {
        const rowRef = row.getAttribute('data-ref') || '';
        const rowClient = row.getAttribute('data-client') || '';
        const rowPhone = row.getAttribute('data-phone') || '';
        const rowEmail = row.getAttribute('data-email') || '';
        const rowStatus = row.getAttribute('data-status') || '';
        const rowDate = row.getAttribute('data-date') || '';

        const matchesQuery = !query ||
          rowRef.includes(query) ||
          rowClient.includes(query) ||
          rowPhone.includes(query) ||
          rowEmail.includes(query);

        const matchesStatus = status === 'all' || rowStatus === status;
        const matchesDate = !date || rowDate === date;

        if (matchesQuery && matchesStatus && matchesDate) {
          row.style.display = '';
          visible++;
        } else {
          row.style.display = 'none';
        }
      });

      visibleCount.textContent = visible;
      resetBtn.style.display = (query || status !== 'all' || date) ? 'inline-block' : 'none';
    }

    searchInput.addEventListener('input', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    dateFilter.addEventListener('change', applyFilters);
    resetBtn.addEventListener('click', () => {
      searchInput.value = '';
      statusFilter.value = 'all';
      dateFilter.value = '';
      applyFilters();
    });
  </script>
</body>
</html>`;
}
