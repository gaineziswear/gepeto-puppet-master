const appPath = window.location.pathname;

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  return response.json();
}

async function fetchVillaData() {
  return fetchJson('/api/villa');
}

function renderResidents(residents) {
  const list = document.getElementById('residentList');
  if (!list) return;
  list.innerHTML = residents.map((resident) => `
    <div class="resident-item active" data-id="${resident.id}">
      <div class="resident-topline">
        <span class="name-tag">${resident.name}</span>
        <span class="provider-tag">${resident.provider}</span>
      </div>
      <div class="role-note">${resident.role}</div>
      <div class="resident-meta">
        <span>${resident.model}</span>
        <span>Trust ${resident.relationships[resident.id]}%</span>
      </div>
    </div>
  `).join('');
}

function renderProviderList(data) {
  const list = document.getElementById('providerList');
  if (!list) return;
  list.innerHTML = data.transparency.providerMap.map((provider) => `
    <div class="provider-pill">
      <span>${provider.name}</span>
      <strong>${provider.provider}</strong>
    </div>
  `).join('');
}

function renderDebate(feed, activeTopic) {
  const debateFeed = document.getElementById('debateFeed');
  const activeTitle = document.getElementById('activeTopic');
  const category = document.getElementById('topicCategory');
  if (!debateFeed || !activeTitle || !category) return;

  activeTitle.textContent = activeTopic.title;
  category.textContent = activeTopic.category;

  debateFeed.innerHTML = feed.map((entry) => `
    <article class="speech">
      <div class="speech-header">
        <span class="speaker">${entry.speaker}</span>
        <span class="speaker-role">${entry.role}</span>
      </div>
      <div class="speech-body">${entry.text}</div>
    </article>
  `).join('');
}

function renderTopics(topics, premiumTopics) {
  const list = document.getElementById('premiumTopics');
  const topicCount = document.getElementById('topicCount');
  if (!list || !topicCount) return;

  list.innerHTML = premiumTopics.slice(0, 4).map((topic) => `<li class="topic-item">${topic}</li>`).join('');
  topicCount.textContent = String((premiumTopics.length || 3) + 1);
}

function renderVoteControls(audienceVotes) {
  const controls = document.getElementById('voteControls');
  if (!controls) return;

  controls.innerHTML = Object.entries(audienceVotes).map(([residentId, count]) => `
    <button class="vote-btn" data-vote="${residentId}">${residentId.toUpperCase()} (${count})</button>
  `).join('');

  controls.querySelectorAll('.vote-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      await fetchJson('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ residentId: button.dataset.vote })
      });
      const villa = await fetchVillaData();
      renderVoteControls(villa.audienceVotes);
    });
  });
}

function renderRelationshipMatrix(residents) {
  const matrix = document.getElementById('relationshipMatrix');
  if (!matrix) return;
  const names = residents.map((person) => person.name.split(' ')[0]);

  const header = `
    <div class="matrix-row">
      <div class="matrix-header label">Resident</div>
      ${names.map((name) => `<div class="matrix-header">${name}</div>`).join('')}
    </div>
  `;

  const rows = residents.map((resident) => {
    const row = residents.map((target) => `<div class="matrix-cell">${resident.relationships[target.id]}</div>`).join('');
    return `
      <div class="matrix-row">
        <div class="matrix-cell label">${resident.name.split(' ')[0]}</div>
        ${row}
      </div>
    `;
  }).join('');

  matrix.innerHTML = header + rows;
}

function renderAdminState(admin, residents) {
  const adminGrid = document.getElementById('adminGrid');
  if (!adminGrid) return;

  const providerStatus = Object.entries(admin.providerStatus || {}).map(([label, state]) => `
    <div class="provider-pill">
      <span>${label}</span>
      <strong>${state}</strong>
    </div>
  `).join('');

  const residentStatus = residents.map((resident) => `
    <div class="provider-pill">
      <span>${resident.name}</span>
      <strong>${resident.provider}</strong>
    </div>
  `).join('');

  adminGrid.innerHTML = `
    <div class="provider-pill"><span>Budget</span><strong>${admin.modelBudget}</strong></div>
    <div class="provider-pill"><span>Latency</span><strong>${admin.latency}</strong></div>
    <div class="provider-pill"><span>Failover</span><strong>${admin.failover}</strong></div>
    <div class="provider-pill"><span>Broadcast</span><strong>${admin.broadcastStatus}</strong></div>
    ${providerStatus}
    ${residentStatus}
  `;
}

function renderEvictionQueue(queue) {
  const evictions = document.getElementById('evictionQueue');
  if (!evictions) return;
  evictions.innerHTML = queue.map((item) => `
    <div class="queue-item"><span>${item.residentId}</span><strong>${item.reason}</strong></div>
  `).join('');
}

function renderTransparency(transparency) {
  const list = document.getElementById('transparencyList');
  if (!list) return;
  list.innerHTML = transparency.providers.map((entry) => `
    <div class="provider-pill">
      <span>${entry.name}</span>
      <strong>${entry.provider} / ${entry.model}</strong>
    </div>
  `).join('');
}

async function refreshData() {
  const villa = await fetchVillaData();
  if (appPath === '/' || appPath === '/index.html') {
    renderResidents(villa.residents);
    renderProviderList(villa);
    renderDebate(villa.debateFeed, villa.currentTopic);
    renderTopics(villa.topics, villa.premiumTopics);
    renderVoteControls(villa.audienceVotes);
    renderRelationshipMatrix(villa.residents);
    return;
  }

  if (appPath === '/admin.html') {
    renderAdminState(villa.admin, villa.residents);
    renderEvictionQueue(villa.evictionQueue);
    return;
  }

  if (appPath === '/transparency.html') {
    const transparency = await fetchJson('/api/transparency');
    renderTransparency(transparency);
  }
}

if (appPath === '/' || appPath === '/index.html') {
  document.getElementById('startDebateBtn')?.addEventListener('click', async () => {
    await fetchJson('/api/debate/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ residentId: 'maya' })
    });
    refreshData();
  });

  document.getElementById('nextRoundBtn')?.addEventListener('click', async () => {
    await fetchJson('/api/debate/next', { method: 'POST' });
    refreshData();
  });

  document.getElementById('submitTopicBtn')?.addEventListener('click', async () => {
    await fetchJson('/api/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Audience-submitted topic: Should residents have a right to veto the villa agenda?' })
    });
    refreshData();
  });
}

refreshData();
