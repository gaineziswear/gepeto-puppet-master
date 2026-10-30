const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');
const { WebSocketServer } = require('ws');
const { initDatabase, db, seedDefaults, fetchVillaState, upsertResident, upsertTopic, insertVote, getVoteSummary, getPremiumMembers, ensureMembership, createAuditEvent, getAdminState } = require('./src/db');
const { ProviderGateway } = require('./src/providerGateway');

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(publicDir));

const providerGateway = new ProviderGateway();

function broadcast(eventName, payload) {
  const message = JSON.stringify({ event: eventName, payload });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

function ensureUserMembership(memberId, email) {
  const member = ensureMembership(memberId, email);
  return member;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/villa', async (req, res) => {
  res.json(fetchVillaState());
});

app.get('/api/residents', async (req, res) => {
  const rows = db.prepare('SELECT * FROM residents ORDER BY id').all();
  res.json({ residents: rows });
});

app.get('/api/topics', async (req, res) => {
  const rows = db.prepare('SELECT * FROM topics ORDER BY created_at DESC').all();
  res.json({ topics: rows });
});

app.get('/api/admin', async (req, res) => {
  res.json(getAdminState());
});

app.get('/api/transparency', async (req, res) => {
  const providers = db.prepare('SELECT * FROM provider_configs ORDER BY resident_id').all();
  res.json({ note: 'The residents are fictional AI personas. Their character identity is separate from the model provider used behind the scenes.', providers });
});

app.get('/api/membership/:memberId', (req, res) => {
  const membership = ensureUserMembership(req.params.memberId, `${req.params.memberId}@example.com`);
  res.json({ member: membership, entitled: membership.entitled });
});

app.post('/api/membership/verify', (req, res) => {
  const { memberId, email, plan } = req.body || {};
  const member = ensureUserMembership(memberId || 'guest-user', email || 'guest@example.com');
  const entitled = !!member && (plan === 'vip' || member.plan === 'vip' || member.entitled);
  if (entitled) {
    const updated = db.prepare('UPDATE members SET plan = ?, entitled = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(plan || 'vip', member.id);
    res.json({ ok: true, member: { ...member, plan: plan || 'vip', entitled: true }, entitled: true });
    return;
  }
  res.status(403).json({ ok: false, entitled: false, message: 'Premium entitlement required' });
});

app.post('/api/topics/submit', (req, res) => {
  const { title, creator_id, submitted_by } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ ok: false, message: 'Topic title is required' });
  }

  const inserted = upsertTopic({
    title: title.trim(),
    category: 'audience',
    creator_id: creator_id || 'premium-user',
    submitted_by: submitted_by || 'premium-user',
    approved: 1,
    status: 'queued'
  });

  broadcast('topic:submitted', { topic: inserted });
  createAuditEvent('topic_submitted', { title: inserted.title, creator_id: inserted.creator_id });
  res.json({ ok: true, topic: inserted });
});

app.post('/api/vote', (req, res) => {
  const { residentId } = req.body || {};
  if (!residentId) {
    return res.status(400).json({ ok: false, message: 'residentId required' });
  }

  const vote = insertVote(residentId);
  const summary = getVoteSummary();
  const winner = Object.entries(summary).sort((a, b) => b[1] - a[1])[0];

  broadcast('vote:updated', { summary, winner });
  createAuditEvent('vote_cast', { resident_id: residentId, total: summary[residentId] });
  res.json({ ok: true, vote, summary, winner });
});

app.post('/api/debate/run', (req, res) => {
  const { residentId = 'maya', topic = 'Should democratic systems adapt to AI-driven governance?' } = req.body || {};
  const resident = db.prepare('SELECT * FROM residents WHERE id = ?').get(residentId);
  const reply = providerGateway.generateResidentResponse({ resident, topic });

  const message = db.prepare(`
    INSERT INTO messages (speaker_id, content, role, topic, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(residentId, reply, 'resident', topic);

  broadcast('debate:updated', { message: { id: message.lastInsertRowid, speaker_id: residentId, content: reply, role: 'resident', topic }, resident });
  createAuditEvent('debate_response', { resident_id: residentId, topic });
  res.json({ ok: true, message: { id: message.lastInsertRowid, speaker_id: residentId, content: reply, role: 'resident', topic }, resident });
});

app.post('/api/debate/next', (req, res) => {
  const nextTopic = db.prepare('SELECT * FROM topics ORDER BY created_at DESC LIMIT 1').all()[0] || { title: 'Can AI improve public trust without reducing human agency?', category: 'technology' };
  const residents = db.prepare('SELECT * FROM residents ORDER BY id').all();
  const speaker = residents[Math.floor(Math.random() * residents.length)];
  const reply = providerGateway.generateResidentResponse({ resident: speaker, topic: nextTopic.title });

  const message = db.prepare(`
    INSERT INTO messages (speaker_id, content, role, topic, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(speaker.id, reply, 'resident', nextTopic.title);

  broadcast('debate:updated', { message: { id: message.lastInsertRowid, speaker_id: speaker.id, content: reply, role: 'resident', topic: nextTopic.title }, topic: nextTopic });
  res.json({ ok: true, topic: nextTopic, message: { id: message.lastInsertRowid, speaker_id: speaker.id, content: reply, topic: nextTopic.title } });
});

app.get('/api/stream-state', (req, res) => {
  res.json(fetchVillaState());
});

app.get('/api/members', (req, res) => {
  res.json({ members: getPremiumMembers() });
});

app.get('/api/render-scene', (req, res) => {
  res.json({
    scene: {
      name: 'Mauritius Villa',
      camera: 'living_room_main',
      lighting: 'golden_hour',
      room: 'grand_living_room',
      stage: 'broadcast_ready'
    },
    status: 'ready',
    outputs: ['main-wide', 'living-room', 'poolside', 'confession-room']
  });
});

app.use((req, res) => {
  const filePath = path.join(publicDir, (req.path === '/' ? 'index.html' : req.path));
  if (fs.existsSync(filePath) && filePath.startsWith(publicDir)) {
    return res.sendFile(filePath);
  }
  res.status(404).json({ ok: false, message: 'Not found' });
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ event: 'connected', payload: { ok: true, state: fetchVillaState() } }));
});

async function startServer() {
  await initDatabase();
  seedDefaults();
  server.listen(PORT, () => {
    console.log(`GEPETO PUPPET MASTER listening on http://localhost:${PORT}`);
  });
}

startServer();
