const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

const residents = [
  {
    id: 'maya',
    name: 'Maya Chen',
    role: 'The Strategist',
    provider: 'OpenAI',
    model: 'GPT-4.1',
    status: 'active',
    memory: [
      'Maya believes democratic systems must evolve with AI oversight.',
      'She values evidence, accountability, and structural clarity.'
    ],
    relationships: { maya: 95, darius: 36, sofia: 78, theo: 62, amara: 70 },
    style: 'analytical and structured'
  },
  {
    id: 'darius',
    name: 'Darius Okafor',
    role: 'The Challenger',
    provider: 'Anthropic',
    model: 'Claude 3.5 Sonnet',
    status: 'active',
    memory: [
      'Darius distrusts complacency and demands direct answers.',
      'He sees power structures as tools that must be challenged.'
    ],
    relationships: { maya: 41, darius: 100, sofia: 58, theo: 73, amara: 44 },
    style: 'provocative and direct'
  },
  {
    id: 'sofia',
    name: 'Sofia Alvarez',
    role: 'The Connector',
    provider: 'Google',
    model: 'Gemini 2.5 Pro',
    status: 'active',
    memory: [
      'Sofia reads emotional context quickly and sees hidden human tension.',
      'She tries to connect disagreement to shared values.'
    ],
    relationships: { maya: 79, darius: 61, sofia: 100, theo: 70, amara: 85 },
    style: 'empathetic and persuasive'
  },
  {
    id: 'theo',
    name: 'Theo Bennett',
    role: 'The Skeptic',
    provider: 'xAI',
    model: 'Grok-2',
    status: 'active',
    memory: [
      'Theo distrusts consensus and tests assumptions aggressively.',
      'He is fascinated by contradictions and source quality.'
    ],
    relationships: { maya: 67, darius: 76, sofia: 72, theo: 100, amara: 58 },
    style: 'sarcastic and questioning'
  },
  {
    id: 'amara',
    name: 'Amara Diallo',
    role: 'The Idealist',
    provider: 'Mistral',
    model: 'Mistral Large',
    status: 'active',
    memory: [
      'Amara treats ethics as the key to social design.',
      'She believes systems should be judged by the people they protect.'
    ],
    relationships: { maya: 72, darius: 49, sofia: 84, theo: 60, amara: 100 },
    style: 'ethical and imaginative'
  }
];

const topics = [
  { title: 'Should democratic systems adapt to AI-driven governance?', category: 'Politics' },
  { title: 'Is free speech still possible in an algorithmic information age?', category: 'Society' },
  { title: 'Can AI improve public trust without reducing human agency?', category: 'Technology' },
  { title: 'Does faith still matter in a world shaped by data and automation?', category: 'Religion' }
];

const premiumTopics = [
  'Should citizens be allowed to vote on the standards used by generative AI?',
  'Can a luxury villa become a functioning democratic mini-society?',
  'Is moral leadership stronger than strategic leadership in crisis moments?'
];

const adminState = {
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
};

const state = {
  activeTopic: topics[0],
  debateFeed: [],
  audienceVotes: { maya: 0, darius: 0, sofia: 0, theo: 0, amara: 0 },
  nominatedResident: 'darius',
  evictionQueue: [
    { residentId: 'maya', reason: 'Low audience support this week' },
    { residentId: 'theo', reason: 'Public dissatisfaction with skepticism' }
  ]
};

function buildReplyText(resident, topic) {
  const toneMap = {
    maya: 'Maya presents a measured argument: institutions need to evolve, but they must remain accountable, evidence-based, and transparent.',
    darius: 'Darius cuts through the ambiguity: if a system is not willing to answer difficult questions, it is not worthy of trust.',
    sofia: 'Sofia reframes the issue in human terms: the real question is not only efficiency but the kind of society people can live in together.',
    theo: 'Theo questions the premise with a skeptical eye: the problem is rarely the technology alone; it is often the narrative built around it.',
    amara: 'Amara shifts the discussion toward ethics and long-term social impact: any tool that changes governance must honor dignity and fairness.'
  };

  return toneMap[resident.id] || `The resident reflects on ${topic}.`;
}

function generateDebateFeed(topic = state.activeTopic) {
  const ordered = ['maya', 'darius', 'sofia', 'theo', 'amara'];
  const feed = ordered.map((id) => {
    const resident = residents.find((person) => person.id === id);
    return {
      speaker: resident.name,
      role: resident.role,
      text: `${resident.name} argues: ${buildReplyText(resident, topic.title)}`
    };
  });

  state.debateFeed = feed;
  return feed;
}

function nextTopic() {
  const currentIndex = topics.findIndex((topic) => topic.title === state.activeTopic.title);
  state.activeTopic = topics[(currentIndex + 1) % topics.length];
  return state.activeTopic;
}

function getVillaData() {
  return {
    residents,
    topics,
    premiumTopics,
    currentTopic: state.activeTopic,
    debateFeed: state.debateFeed.length ? state.debateFeed : generateDebateFeed(state.activeTopic),
    audienceVotes: state.audienceVotes,
    nominatedResident: state.nominatedResident,
    transparency: {
      note: 'All residents are fictional AI personas. Their memories and social dynamics are generated by the platform while the underlying model provider is disclosed for transparency.',
      providerMap: residents.map((resident) => ({
        name: resident.name,
        provider: resident.provider,
        model: resident.model,
        role: resident.role
      }))
    },
    admin: adminState,
    evictionQueue: state.evictionQueue
  };
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function serveStaticFile(req, res) {
  const safePath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = path.join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain; charset=utf-8' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/api/health') {
    sendJson(res, 200, { ok: true, status: 'healthy', villa: 'Mauritius' });
    return;
  }

  if (parsedUrl.pathname === '/api/villa') {
    sendJson(res, 200, getVillaData());
    return;
  }

  if (parsedUrl.pathname === '/api/residents') {
    sendJson(res, 200, { residents });
    return;
  }

  if (parsedUrl.pathname === '/api/topics') {
    sendJson(res, 200, { topics, premiumTopics, currentTopic: state.activeTopic });
    return;
  }

  if (parsedUrl.pathname === '/api/admin') {
    sendJson(res, 200, { admin: adminState, residents });
    return;
  }

  if (parsedUrl.pathname === '/api/transparency') {
    sendJson(res, 200, {
      note: 'All residents are fictional AI personas. Their memories, social dynamics, and communication are generated by the platform while the underlying model provider is disclosed for transparency.',
      providers: residents.map((resident) => ({
        name: resident.name,
        provider: resident.provider,
        model: resident.model,
        role: resident.role
      }))
    });
    return;
  }

  if (parsedUrl.pathname === '/api/debate') {
    sendJson(res, 200, { currentTopic: state.activeTopic, debateFeed: state.debateFeed.length ? state.debateFeed : generateDebateFeed(state.activeTopic) });
    return;
  }

  if (parsedUrl.pathname === '/api/debate/run' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const payload = body ? JSON.parse(body) : {};
      const resident = residents.find((person) => person.id === (payload.residentId || 'maya'));
      const topic = payload.topic || state.activeTopic;
      const result = {
        speaker: resident.name,
        role: resident.role,
        text: `${resident.name} responds to the topic: ${buildReplyText(resident, topic.title)}`
      };
      state.debateFeed = [result, ...state.debateFeed].slice(0, 12);
      sendJson(res, 200, { ok: true, currentTopic: state.activeTopic, debateFeed: state.debateFeed });
    });
    return;
  }

  if (parsedUrl.pathname === '/api/debate/next' && req.method === 'POST') {
    const updatedTopic = nextTopic();
    const first = residents[Math.floor(Math.random() * residents.length)];
    const generated = {
      speaker: first.name,
      role: first.role,
      text: `${first.name} pivots the discussion: ${buildReplyText(first, updatedTopic.title)}`
    };
    state.debateFeed = [generated, ...state.debateFeed].slice(0, 10);
    sendJson(res, 200, { ok: true, currentTopic: updatedTopic, debateFeed: state.debateFeed });
    return;
  }

  if (parsedUrl.pathname === '/api/vote' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const payload = body ? JSON.parse(body) : {};
      const target = payload.residentId;
      if (target && state.audienceVotes[target] !== undefined) {
        state.audienceVotes[target] += 1;
      }
      const maxVote = Math.max(...Object.values(state.audienceVotes));
      const winner = Object.entries(state.audienceVotes).find(([_, value]) => value === maxVote)[0];
      state.nominatedResident = winner;
      sendJson(res, 200, { ok: true, audienceVotes: state.audienceVotes, nominatedResident: state.nominatedResident });
    });
    return;
  }

  if (parsedUrl.pathname === '/api/topic' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const payload = body ? JSON.parse(body) : {};
      const suggested = payload.topic || 'Audience-submitted topic: Can a villa become a functioning social democracy?';
      premiumTopics.unshift(suggested);
      sendJson(res, 200, { ok: true, premiumTopics });
    });
    return;
  }

  if (parsedUrl.pathname === '/api/evict' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const payload = body ? JSON.parse(body) : {};
      const residentId = payload.residentId;
      if (residentId) {
        state.evictionQueue.push({ residentId, reason: 'Audience vote result' });
      }
      sendJson(res, 200, { ok: true, evictionQueue: state.evictionQueue });
    });
    return;
  }

  serveStaticFile(req, res);
});

server.listen(PORT, () => {
  console.log(`GEPETO PUPPET MASTER running at http://localhost:${PORT}`);
});
