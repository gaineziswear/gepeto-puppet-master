const socket = new WebSocket(`ws://${window.location.host}`);

function fetchJson(url, options) {
  return fetch(url, options).then((res) => res.json());
}

async function refreshState() {
  const data = await fetchJson('/api/villa');
  renderResidents(data.residents);
  renderProviderList(data.transparency.providerMap);
  renderDebate(data.debateFeed, data.currentTopic);
  renderTopicQueue(data.premiumTopics);
  renderRelationshipMatrix(data.residents);
  renderVoteControls(data.audienceVotes);
  renderSceneStatus(data);
}

function renderResidents(residents) {
  const list = document.getElementById('residentList');
  list.innerHTML = residents.map((resident) => `
    <div class="resident-item active">
      <div class="resident-topline">
        <span class="name-tag">${resident.name}</span>
        <span class="provider-tag">${resident.provider}</span>
      </div>
      <div class="role-note">${resident.role}</div>
      <div class="resident-meta">
        <span>${resident.model}</span>
        <span>Trust 72%</span>
      </div>
    </div>
  `).join('');
}

function renderProviderList(providers) {
  const list = document.getElementById('providerList');
  list.innerHTML = providers.map((provider) => `
    <div class="provider-pill">
      <span>${provider.name}</span>
      <strong>${provider.provider}</strong>
    </div>
  `).join('');
}

function renderDebate(feed, topic) {
  const active = document.getElementById('activeTopic');
  const category = document.getElementById('topicCategory');
  const container = document.getElementById('debateFeed');
  active.textContent = topic.title;
  category.textContent = topic.category || 'Politics';
  container.innerHTML = feed.map((entry) => `
    <article class="speech">
      <div class="speech-header">
        <span class="speaker">${entry.speaker}</span>
        <span class="speaker-role">${entry.role}</span>
      </div>
      <div class="speech-body">${entry.text}</div>
    </article>
  `).join('');
}

function renderTopicQueue(topics) {
  const list = document.getElementById('premiumTopics');
  list.innerHTML = topics.slice(0, 4).map((topic) => `<li class="topic-item">${topic}</li>`).join('');
  const count = document.getElementById('topicCount');
  count.textContent = String(topics.length + 1);
}

function renderVoteControls(votes) {
  const container = document.getElementById('voteControls');
  container.innerHTML = Object.entries(votes).map(([residentId, count]) => `
    <button class="vote-btn" data-id="${residentId}">${residentId.toUpperCase()} (${count})</button>
  `).join('');

  container.querySelectorAll('.vote-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      await fetchJson('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ residentId: button.dataset.id })
      });
      refreshState();
    });
  });
}

function renderRelationshipMatrix(residents) {
  const matrix = document.getElementById('relationshipMatrix');
  const names = residents.map((person) => person.name.split(' ')[0]);

  const header = `
    <div class="matrix-row">
      <div class="matrix-header label">Resident</div>
      ${names.map((name) => `<div class="matrix-header">${name}</div>`).join('')}
    </div>
  `;

  const rows = residents.map((resident) => {
    const row = residents.map((target) => `<div class="matrix-cell">72</div>`).join('');
    return `
      <div class="matrix-row">
        <div class="matrix-cell label">${resident.name.split(' ')[0]}</div>
        ${row}
      </div>
    `;
  }).join('');

  matrix.innerHTML = header + rows;
}

function renderSceneStatus(data) {
  const sceneStatus = document.getElementById('sceneStatus');
  sceneStatus.innerHTML = `
    <div class="provider-pill"><span>Scene</span><strong>${data.currentTopic.title}</strong></div>
    <div class="provider-pill"><span>Camera</span><strong>grand_living_room</strong></div>
    <div class="provider-pill"><span>Lighting</span><strong>golden_hour</strong></div>
    <div class="provider-pill"><span>Output</span><strong>broadcast_ready</strong></div>
  `;
}

async function startDebate() {
  await fetchJson('/api/debate/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ residentId: 'maya', topic: 'Should democratic systems adapt to AI-driven governance?' })
  });
  refreshState();
}

async function nextRound() {
  await fetchJson('/api/debate/next', { method: 'POST' });
  refreshState();
}

async function submitTopic() {
  await fetchJson('/api/topics/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Should residents have a right to veto the villa agenda?', creator_id: 'premium-user', submitted_by: 'premium-user' })
  });
  refreshState();
}

document.getElementById('startDebateBtn').addEventListener('click', startDebate);
document.getElementById('nextRoundBtn').addEventListener('click', nextRound);
document.getElementById('submitTopicBtn').addEventListener('click', submitTopic);

socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  if (data.event === 'vote:updated' || data.event === 'debate:updated' || data.event === 'topic:submitted') {
    refreshState();
  }
});

refreshState();
