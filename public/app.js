async function fetchVillaData() {
  const response = await fetch('/api/villa');
  return response.json();
}

function renderResidents(residents) {
  const list = document.getElementById('residentList');
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

  list.innerHTML = premiumTopics.slice(0, 4).map((topic) => `<li class="topic-item">${topic}</li>`).join('');
  topicCount.textContent = String((premiumTopics.length || 3) + 1);
}

function renderVoteControls(audienceVotes) {
  const controls = document.getElementById('voteControls');
  controls.innerHTML = Object.entries(audienceVotes).map(([residentId, count]) => `
    <button class="vote-btn" data-vote="${residentId}">${residentId.toUpperCase()} (${count})</button>
  `).join('');

  controls.querySelectorAll('.vote-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      await fetch('/api/vote', {
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

async function refreshData() {
  const villa = await fetchVillaData();
  renderResidents(villa.residents);
  renderProviderList(villa);
  renderDebate(villa.debateFeed, villa.currentTopic);
  renderTopics(villa.topics, villa.premiumTopics);
  renderVoteControls(villa.audienceVotes);
  renderRelationshipMatrix(villa.residents);
}

document.getElementById('startDebateBtn').addEventListener('click', async () => {
  await fetch('/api/debate/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ residentId: 'maya' })
  });
  refreshData();
});

document.getElementById('nextRoundBtn').addEventListener('click', async () => {
  await fetch('/api/debate/next', { method: 'POST' });
  refreshData();
});

document.getElementById('submitTopicBtn').addEventListener('click', async () => {
  await fetch('/api/topic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: 'Audience-submitted topic: Should residents have a right to veto the villa agenda?' })
  });
  refreshData();
});

refreshData();
