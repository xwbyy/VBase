#!/usr/bin/env node
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const { loadUsers, saveUser, initSheets, loadDatabases, saveDatabase } = require('./sheets');

const app = express();

// Middleware
app.set('trust proxy', 1);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'vbase_session_secret',
  resave: true,
  saveUninitialized: true,
  proxy: true,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,
    secure: true,
    sameSite: 'lax',
    httpOnly: true
  }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Security Headers for Production
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// In-memory database for MVP
let users = {};
let databases = {};
let apiKeys = {};

// Auth middleware
const requireAuth = async (req, res, next) => {
  if (!req.session.userId || !req.session.email) {
    return res.redirect('/login');
  }

  // Handle Vercel Cold Starts: If users memory is wiped but session exists
  if (Object.keys(users).length === 0 || !users[req.session.email]) {
    try {
      await syncWithSheets();
    } catch (e) {
      console.error('Auth sync failed:', e);
    }
  }

  if (users[req.session.email]) {
    next();
  } else {
    req.session.destroy();
    res.redirect('/login');
  }
};

const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !apiKeys[apiKey]) {
    return res.status(401).json({ error: 'Invalid API Key' });
  }
  req.userId = apiKeys[apiKey];
  next();
};

// Admin config
const ADMIN_EMAIL = 'admin@vynaa.web.id';
const ADMIN_USERNAME = 'admin123';
const ADMIN_PW = 'pwadmin123';

const ADMIN2_EMAIL = 'admin2@vynaa.web.id';
const ADMIN2_USERNAME = 'admin2';
const ADMIN2_PW = 'pwadmin123';

// Sync with Google Sheets on startup
async function syncWithSheets() {
    try {
        console.log('Syncing with Google Sheets...');
        users = await loadUsers();
        databases = await loadDatabases();
        
        // Ensure Admin User exists in Sheets
        const admins = [
            {
                email: ADMIN_EMAIL,
                username: ADMIN_USERNAME,
                password: ADMIN_PW,
                id: 'admin_001',
                name: 'Vynaa Admin'
            },
            {
                email: ADMIN2_EMAIL,
                username: ADMIN2_USERNAME,
                password: ADMIN2_PW,
                id: 'admin_002',
                name: 'Vynaa Admin 2'
            }
        ];

        for (const adminData of admins) {
            if (!users[adminData.email]) {
                users[adminData.email] = {
                    id: adminData.id,
                    email: adminData.email,
                    username: adminData.username,
                    password: adminData.password,
                    name: adminData.name,
                    plan: 'enterprise',
                    role: 'admin',
                    apiKey: `vbase_${adminData.username}_key`,
                    databases: [],
                    requests: 0,
                    createdAt: new Date(),
                    limits: { free: 999999, enterprise: 999999 }
                };
                await saveUser(users[adminData.email]);
            } else {
                // Ensure credentials match config EXACTLY
                users[adminData.email].password = adminData.password.trim();
                users[adminData.email].role = 'admin';
                users[adminData.email].id = adminData.id;
                users[adminData.email].username = adminData.username;
                users[adminData.email].name = adminData.name;
            }
        }

        // Ensure Demo account exists
        if (!users['demo@vbase.com']) {
            users['demo@vbase.com'] = {
                id: 'user_demo',
                email: 'demo@vbase.com',
                password: 'demo123',
                name: 'Demo User',
                plan: 'free',
                apiKey: 'vbase_demo_key',
                databases: [],
                requests: 0,
                createdAt: new Date(),
                limits: { free: 500 }
            };
            await saveUser(users['demo@vbase.com']);
        }

        // Rebuild apiKeys lookup and user database arrays
        apiKeys = {};
        Object.values(users).forEach(u => {
            apiKeys[u.apiKey] = u.id;
            u.databases = (databases[u.email] || []).map(db => db.id);
        });
        
        console.log('VBase is now powered by Google Sheets! 🚀');
        console.log('Sheets Sync Complete.');
    } catch (e) {
        console.error('Sync failed:', e);
    }
}
syncWithSheets();

// Helper for terminal-style logging
const logEvent = (type, message, details = {}) => {
  const timestamp = new Date().toLocaleTimeString();
  const colors = {
    auth: '\x1b[36m', // Cyan
    db: '\x1b[35m',   // Magenta
    api: '\x1b[32m',  // Green
    error: '\x1b[31m' // Red
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type] || ''}[${timestamp}] [${type.toUpperCase()}] ${message}${reset}`, details);
};

// Routes - Public
app.get('/', (req, res) => {
  const user = req.session.email ? users[req.session.email] : null;
  res.render('index', { user });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users[email];
  
  if (!user) {
    logEvent('error', 'Login failed: User not found', { email });
    return res.status(401).json({ error: 'User not found' });
  }

  if (password.trim() === user.password.trim() || (email === 'demo@vbase.com' && password === 'demo123')) {
      // Clear debug logs before production
      // console.log(`Login attempt for ${email}...`);
      req.session.userId = user.id;
      req.session.email = email;
      req.session.isAdmin = user.role === 'admin';
      logEvent('auth', `User logged in: ${email}`, { role: user.role });
      return res.json({ success: true, redirect: user.role === 'admin' ? '/admin' : '/dashboard' });
  }
  logEvent('error', 'Login failed: Invalid password', { email });
  res.status(401).json({ error: 'Invalid password' });
});

// Admin Routes
app.get('/admin', requireAuth, (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/dashboard');
    res.render('admin', { user: users[req.session.email], allUsers: Object.values(users) });
});

app.post('/api/admin/update-plan', requireAuth, async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    const { email, plan } = req.body;
    if (users[email]) {
        users[email].plan = plan;
        await saveUser(users[email]);
        logEvent('admin', `Plan updated for ${email} to ${plan}`);
        return res.json({ success: true });
    }
    res.status(404).json({ error: 'User not found' });
});

app.get('/api/admin/sync', requireAuth, async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    await syncWithSheets();
    logEvent('admin', 'Manual sheets sync triggered');
    res.json({ success: true, message: 'Synchronized with Google Sheets' });
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  if (users[email]) {
    logEvent('error', 'Registration failed: User already exists', { email });
    return res.status(400).json({ error: 'User already exists' });
  }

  const userId = 'user_' + uuidv4().slice(0, 8);
  const apiKey = 'vbase_' + uuidv4();
  
  const newUser = {
    id: userId,
    email,
    password,
    name,
    plan: 'free',
    apiKey,
    databases: [],
    requests: 0,
    createdAt: new Date(),
    limits: {
      free: 500,
      vip1: 10000,
      vip2: 20000,
      vip3: 50000
    }
  };

  users[email] = newUser;
  apiKeys[apiKey] = userId;
  
  await saveUser(newUser);
  logEvent('auth', `New user registered: ${email}`, { name });

  req.session.userId = userId;
  req.session.email = email;
  
  res.json({ success: true, redirect: '/dashboard' });
});

// Routes - Protected
app.get('/dashboard', requireAuth, (req, res) => {
  const email = req.session.email;
  const user = users[email];
  res.render('dashboard', { user, page: 'dashboard' });
});

app.get('/profile', requireAuth, (req, res) => {
  const email = req.session.email;
  const user = users[email];
  res.render('profile', { user, page: 'profile' });
});

app.get('/docs', requireAuth, (req, res) => {
  const email = req.session.email;
  const user = users[email];
  res.render('docs', { user, page: 'docs' });
});

app.get('/tools', requireAuth, (req, res) => {
  const email = req.session.email;
  const user = users[email];
  res.render('tools', { user, page: 'tools' });
});

app.get('/databases', requireAuth, (req, res) => {
  const email = req.session.email;
  const user = users[email];
  const userDatabases = databases[user.email] || [];
  res.render('databases', { user, userDatabases, page: 'databases' });
});

app.get('/status', (req, res) => {
  const user = req.session.email ? users[req.session.email] : null;
  res.render('status', { user, page: 'status' });
});

app.get('/terms', (req, res) => {
  const user = req.session.email ? users[req.session.email] : null;
  res.render('terms', { user, page: 'terms' });
});

app.get('/privacy', (req, res) => {
  const user = req.session.email ? users[req.session.email] : null;
  res.render('privacy', { user, page: 'privacy' });
});

app.post('/api/databases/create', requireAuth, async (req, res) => {
  const { name, type, description } = req.body;
  const email = req.session.email;
  const user = users[email];
  
  if (user.plan === 'free' && user.databases.length >= 5) {
      return res.status(403).json({ error: 'Database limit reached for Free plan (max 5)' });
  }

  const dbId = 'db_' + uuidv4().slice(0, 8);
  const newDb = {
    id: dbId,
    name,
    type,
    description,
    ownerEmail: email,
    createdAt: new Date(),
    records: [],
    schema: {}
  };

  if (!databases[user.email]) {
    databases[user.email] = [];
  }

  databases[user.email].push(newDb);
  user.databases.push(dbId);
  
  await saveDatabase(user.id, newDb);

  res.json({ success: true, database: newDb });
});

app.get('/api/databases', requireAuth, (req, res) => {
  const email = req.session.email;
  const userDatabases = databases[email] || [];
  res.json({ databases: userDatabases });
});

// API Endpoints with usage tracking
app.post('/api/db/:dbId/insert', validateApiKey, async (req, res) => {
  const { dbId } = req.params;
  const data = req.body;
  const user = Object.values(users).find(u => u.id === req.userId);
  
  if (!user) {
    logEvent('error', 'API Error: User not found for API Key', { apiKey: req.headers['x-api-key'] });
    return res.status(401).json({ error: 'User not found' });
  }
  
  const limit = user.limits[user.plan] || 500;
  if (user.requests >= limit) {
      logEvent('error', 'API Limit Reached', { user: user.email, plan: user.plan });
      return res.status(403).json({ error: 'Monthly request limit reached' });
  }

  // Find database
  let db = null;
  for (let email in databases) {
    db = databases[email].find(d => d.id === dbId);
    if (db) break;
  }

  if (!db) {
    logEvent('error', 'API Error: Database not found', { dbId });
    return res.status(404).json({ error: 'Database not found' });
  }

  user.requests++;
  await saveUser(user);
  
  const recordId = 'rec_' + uuidv4().slice(0, 8);
  const record = { id: recordId, ...data, timestamp: new Date() };
  db.records.push(record);

  logEvent('api', `Data inserted into ${dbId}`, { recordId, user: user.email });
  res.json({ success: true, record });
});

app.get('/api/db/:dbId/select', validateApiKey, async (req, res) => {
  const { dbId } = req.params;
  const user = Object.values(users).find(u => u.id === req.userId);
  if (user) {
      user.requests++;
      await saveUser(user);
  }
  
  let db = null;
  for (let email in databases) {
    db = databases[email].find(d => d.id === dbId);
    if (db) break;
  }

  if (!db) {
    logEvent('error', 'API Error: Database not found', { dbId });
    return res.status(404).json({ error: 'Database not found' });
  }

  logEvent('api', `Data selected from ${dbId}`, { user: user ? user.email : 'unknown' });
  res.json({ records: db.records });
});

app.post('/api/db/:dbId/update/:recordId', validateApiKey, async (req, res) => {
  const { dbId, recordId } = req.params;
  const data = req.body;
  const user = Object.values(users).find(u => u.id === req.userId);

  let db = null;
  for (let email in databases) {
    db = databases[email].find(d => d.id === dbId);
    if (db) break;
  }

  if (!db) {
    logEvent('error', 'API Error: Database not found', { dbId });
    return res.status(404).json({ error: 'Database not found' });
  }

  const record = db.records.find(r => r.id === recordId);
  if (!record) {
    logEvent('error', 'API Error: Record not found', { dbId, recordId });
    return res.status(404).json({ error: 'Record not found' });
  }

  Object.assign(record, data);
  if (user) {
    user.requests++;
    await saveUser(user);
  }
  logEvent('api', `Record updated in ${dbId}`, { recordId, user: user ? user.email : 'unknown' });
  res.json({ success: true, record });
});

app.delete('/api/db/:dbId/delete/:recordId', validateApiKey, async (req, res) => {
  const { dbId, recordId } = req.params;
  const user = Object.values(users).find(u => u.id === req.userId);

  let db = null;
  for (let email in databases) {
    db = databases[email].find(d => d.id === dbId);
    if (db) break;
  }

  if (!db) {
    logEvent('error', 'API Error: Database not found', { dbId });
    return res.status(404).json({ error: 'Database not found' });
  }

  const initialLength = db.records.length;
  db.records = db.records.filter(r => r.id !== recordId);
  
  if (db.records.length === initialLength) {
    logEvent('error', 'API Error: Record not found for deletion', { dbId, recordId });
    return res.status(404).json({ error: 'Record not found' });
  }

  if (user) {
    user.requests++;
    await saveUser(user);
  }
  logEvent('api', `Record deleted from ${dbId}`, { recordId, user: user ? user.email : 'unknown' });
  res.json({ success: true });
});

// Health check for Vercel
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`VBase server running on http://0.0.0.0:${PORT}`);
});
