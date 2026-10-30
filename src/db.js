const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = process.env.DB_PATH || path.join(dataDir, 'gepeto.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS residents (
      id TEXT PRIMARY KEY,
      name TEXT,
      role TEXT,
      provider TEXT,
      model TEXT,
      status TEXT,
      memory TEXT,
      style TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      category TEXT,
      creator_id TEXT,
      submitted_by TEXT,
      approved INTEGER DEFAULT 0,
      status TEXT DEFAULT 'queued',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      speaker_id TEXT,
      content TEXT,
      role TEXT,
      topic TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      email TEXT,
      plan TEXT DEFAULT 'free',
      entitled INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS provider_configs (
      resident_id TEXT PRIMARY KEY,
      provider TEXT,
      model TEXT,
      status TEXT,
      fallback_provider TEXT,
      token_budget TEXT,
      latency TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT,
      payload TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

function seedDefaults() {
  const residentSeed = [
    ['maya', 'Maya Chen', 'The Strategist', 'OpenAI', 'GPT-4.1', 'active', JSON.stringify(['Evidence-driven and strategic.','Values institutional oversight and democratic adaptation.']), 'analytical and structured'],
    ['darius', 'Darius Okafor', 'The Challenger', 'Anthropic', 'Claude 3.5 Sonnet', 'active', JSON.stringify(['Challenges assumptions and power structures.','Demands direct answers and accountability.']), 'provocative and direct'],
    ['sofia', 'Sofia Alvarez', 'The Connector', 'Google', 'Gemini 2.5 Pro', 'active', JSON.stringify(['Values emotional context and connectedness.','Seeks alignment between values and social outcomes.']), 'empathetic and persuasive'],
    ['theo', 'Theo Bennett', 'The Skeptic', 'xAI', 'Grok-2', 'active', JSON.stringify(['Questions sources and assumptions.','Suspicious of narratives that hide power structures.']), 'sarcastic and questioning'],
    ['amara', 'Amara Diallo', 'The Idealist', 'Mistral', 'Mistral Large', 'active', JSON.stringify(['Ethics first, then systems.','Wants to protect dignity and future generations.']), 'ethical and imaginative']
  ];

  const residentInsert = db.prepare(`
    INSERT OR IGNORE INTO residents (id, name, role, provider, model, status, memory, style)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  residentSeed.forEach((row) => residentInsert.run(row));

  const providerSeed = [
    ['maya', 'OpenAI', 'GPT-4.1', 'healthy', 'Anthropic', '2.4M tokens / week', '1.2s median'],
    ['darius', 'Anthropic', 'Claude 3.5 Sonnet', 'healthy', 'OpenAI', '2.4M tokens / week', '1.3s median'],
    ['sofia', 'Google', 'Gemini 2.5 Pro', 'healthy', 'OpenAI', '2.2M tokens / week', '1.0s median'],
    ['theo', 'xAI', 'Grok-2', 'degraded', 'OpenAI', '1.8M tokens / week', '2.4s median'],
    ['amara', 'Mistral', 'Mistral Large', 'healthy', 'Google', '2.1M tokens / week', '1.1s median']
  ];

  const providerInsert = db.prepare(`
    INSERT OR IGNORE INTO provider_configs (resident_id, provider, model, status, fallback_provider, token_budget, latency)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  providerSeed.forEach((row) => providerInsert.run(row));

  const topicSeed = [
    ['Should democratic systems adapt to AI-driven governance?', 'Politics', 'system', 'system', 1, 'approved'],
    ['Is free speech still possible in an algorithmic information age?', 'Society', 'system', 'system', 1, 'approved'],
    ['Can AI improve public trust without reducing human agency?', 'Technology', 'system', 'system', 1, 'approved']
  ];

  const topicInsert = db.prepare(`
    INSERT OR IGNORE INTO topics (title, category, creator_id, submitted_by, approved, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  topicSeed.forEach((row) => topicInsert.run(row));

  const memberSeed = [
    ['premium-user', 'premium-user@example.com', 'vip', 1],
    ['guest-user', 'guest@example.com', 'free', 0]
  ];

  const memberInsert = db.prepare(`
    INSERT OR IGNORE INTO members (id, email, plan, entitled)
    VALUES (?, ?, ?, ?)
  `);

  memberSeed.forEach((row) => memberInsert.run(row));
}

function upsertResident(resident) {
  return db.prepare(`
    INSERT INTO residents (id, name, role, provider, model, status, memory, style, updated_at)
    VALUES (@id, @name, @role, @provider, @model, @status, @memory, @style, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      role = excluded.role,
      provider = excluded.provider,
      model = excluded.model,
      status = excluded.status,
      memory = excluded.memory,
      style = excluded.style,
      updated_at = CURRENT_TIMESTAMP
  `).run(resident);
}

function upsertTopic(topic) {
  const insert = db.prepare(`
    INSERT INTO topics (title, category, creator_id, submitted_by, approved, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = insert.run(topic.title, topic.category || 'audience', topic.creator_id || 'system', topic.submitted_by || 'system', topic.approved || 1, topic.status || 'queued');
  return { id: result.lastID, ...topic, approved: topic.approved || 1, status: topic.status || 'queued' };
}

function insertVote(residentId) {
  return db.prepare('INSERT INTO votes (resident_id) VALUES (?)').run(residentId);
}

function getVoteSummary() {
  const rows = db.prepare('SELECT resident_id, COUNT(*) as count FROM votes GROUP BY resident_id').all();
  const summary = { maya: 0, darius: 0, sofia: 0, theo: 0, amara: 0 };
  rows.forEach((row) => {
    summary[row.resident_id] = row.count;
  });
  return summary;
}

function getPremiumMembers() {
  return db.prepare('SELECT * FROM members ORDER BY created_at DESC').all();
}

function ensureMembership(memberId, email) {
  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
  if (existing) return existing;
  const result = db.prepare('INSERT INTO members (id, email, plan, entitled) VALUES (?, ?, ?, ?)').run(memberId, email, 'free', 0);
  return { id: memberId, email, plan: 'free', entitled: 0 };
}

function createAuditEvent(action, payload) {
  return db.prepare('INSERT INTO audit_logs (action, payload) VALUES (?, ?)').run(action, JSON.stringify(payload));
}

function getAdminState() {
  return {
    admin: {
      modelBudget: '2.4M tokens / week',
      latency: '1.2s median',
      failover: 'Enabled',
      broadcastStatus: 'Live',
      providerStatus: {
        OpenAI: 'healthy',
        Anthropic: 'healthy',
        Google: 'healthy',
        xAI: 'degraded',
        Mistral: 'healthy'
      }
    },
    residents: db.prepare('SELECT * FROM residents ORDER BY id').all()
  };
}

function fetchVillaState() {
  const residents = db.prepare('SELECT * FROM residents ORDER BY id').all();
  const topics = db.prepare('SELECT * FROM topics ORDER BY created_at DESC').all();
  const votes = getVoteSummary();
  const members = getPremiumMembers();
  const messages = db.prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT 12').all();

  const normalizedResidents = residents.map((resident) => ({
    ...resident,
    relationships: JSON.parse(resident.memory || '{}')
  }));

  const names = residents.reduce((acc, resident) => {
    acc[resident.id] = resident.name;
    return acc;
  }, {});

  return {
    residents: normalizedResidents.map((resident) => ({
      ...resident,
      memory: JSON.parse(resident.memory || '[]'),
      relationships: {
        maya: 95,
        darius: 41,
        sofia: 79,
        theo: 67,
        amara: 72
      }
    })),
    topics,
    premiumTopics: ['Should citizens be allowed to vote on the standards used by generative AI?', 'Can a luxury villa become a functioning democratic mini-society?', 'Is moral leadership stronger than strategic leadership in crisis moments?'],
    currentTopic: topics[0] || { title: 'Should democratic systems adapt to AI-driven governance?', category: 'Politics' },
    debateFeed: messages.map((message) => ({
      speaker: names[message.speaker_id] || message.speaker_id,
      role: 'resident',
      text: message.content
    })),
    audienceVotes: votes,
    nominatedResident: Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'maya',
    transparency: {
      note: 'All residents are fictional AI personas. Their memories and social dynamics are generated by the platform while the underlying model provider is disclosed for transparency.',
      providerMap: residents.map((resident) => ({
        name: resident.name,
        provider: resident.provider,
        model: resident.model,
        role: resident.role
      }))
    },
    admin: getAdminState().admin,
    members,
    evictionQueue: [
      { residentId: 'maya', reason: 'Low audience support this week' },
      { residentId: 'theo', reason: 'Public dissatisfaction with skepticism' }
    ]
  };
}

module.exports = {
  db,
  initDatabase,
  seedDefaults,
  upsertResident,
  upsertTopic,
  insertVote,
  getVoteSummary,
  getPremiumMembers,
  ensureMembership,
  createAuditEvent,
  getAdminState,
  fetchVillaState
};
