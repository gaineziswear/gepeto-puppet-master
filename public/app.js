const residents = [
  {
    id: 'maya',
    name: 'Maya Chen',
    role: 'The Strategist',
    provider: 'OpenAI',
    model: 'GPT-4.1',
    mood: 'calm',
    memory: [
      'Maya believes democracy must evolve with AI oversight.',
      'She values systems, evidence, and institutional accountability.'
    ],
    relationships: {
      maya: 95,
      darius: 36,
      sofia: 78,
      theo: 62,
      amara: 70
    },
    style: 'analytical and structured',
    color: '#58d2c4'
  },
  {
    id: 'darius',
    name: 'Darius Okafor',
    role: 'The Challenger',
    provider: 'Anthropic',
    model: 'Claude 3.5 Sonnet',
    mood: 'combative',
    memory: [
      'Darius distrusts complacency and demands direct answers.',
      'He sees power structures as tools that must be challenged.'
    ],
    relationships: {
      maya: 41,
      darius: 100,
      sofia: 58,
      theo: 73,
      amara: 44
    },
    style: 'provocative and direct',
    color: '#f7bd6d'
  },
  {
    id: 'sofia',
    name: 'Sofia Alvarez',
    role: 'The Connector',
    provider: 'Google',
    model: 'Gemini 2.5 Pro',
    mood: 'empathetic',
    memory: [
      'Sofia reads emotional context faster than she reads policy documents.',
      'She wants to connect disagreement with underlying human values.'
    ],
    relationships: {
      maya: 79,
      darius: 61,
      sofia: 100,
      theo: 70,
      amara: 85
    },
    style: 'empathetic and persuasive',
    color: '#8dbdff'
  },
  {
    id: 'theo',
    name: 'Theo Bennett',
    role: 'The Skeptic',
    provider: 'xAI',
    model: 'Grok-2',
    mood: 'wry',
    memory: [
      'Theo distrusts consensus and tests assumptions aggressively.',
      'He is fascinated by contradictions and source quality.'
    ],
    relationships: {
      maya: 67,
      darius: 76,
      sofia: 72,
      theo: 100,
      amara: 58
    },
    style: 'sarcastic and questioning',
    color: '#b7a0ff'
  },
  {
    id: 'amara',
    name: 'Amara Diallo',
    role: 'The Idealist',
    provider: 'Mistral',
    model: 'Mistral Large',
    mood: 'reflective',
    memory: [
      'Amara treats ethics as the key to any social design problem.',
      'She believes systems should be judged by the people they protect.'
    ],
    relationships: {
      maya: 72,
      darius: 49,
      sofia: 84,
      theo: 60,
      amara: 100
    },
    style: 'ethical and imaginative',
    color: '#ff8ac2'
  }
];

const topics = [
  {
    title: 'Should democratic systems adapt to AI-driven governance?',
    category: 'Politics'
  },
  {
    title: 'Is free speech still possible in an algorithmic information age?',
    category: 'Society'
  },
  {
    title: 'Can AI improve public trust without reducing human agency?',
    category: 'Technology'
  },
  {
    title: 'Does faith still matter in a world shaped by data and automation?',
    category: 'Religion'
  }
];

const premiumTopics = [
  'Should citizens be allowed to vote on the standards used by generative AI?',
  'Can a luxury villa become a functioning democratic mini-society?',
  'Is moral leadership stronger than strategic leadership in crisis moments?'
];

const state = {
  activeTopic: topics[0],
  debateFeed: [],
  audienceVotes: {
    maya: 0,
    darius: 0,
    sofia: 0,
    theo: 0,
    amara: 0
  },
  nominatedResident: 'darius'
};

function renderResidents() {
  const residentList = document.getElementById('residentList');
  residentList.innerHTML = residents.map((resident) => `
    <div class="resident-item ${resident.id === state.nominatedResident ? 'active' : ''}" data-id="${resident.id}">
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

  residentList.querySelectorAll('.resident-item').forEach((item) => {
    item.addEventListener('click', () => {
      state.nominatedResident = item.dataset.id;
      renderResidents();
      renderVoteControls();
    });
  });
}

function renderTopicList() {
  const list = document.getElementById('premiumTopics');
  list.innerHTML = premiumTopics.map((topic) => `<li class="topic-item">${topic}</li>`).join('');

  const topicCount = document.getElementById('topicCount');
  topicCount.textContent = String(premiumTopics.length + 1);
}

function buildReplyText(resident, topic) {
  const toneMap = {
    maya: 'Maya presents a measured version of the argument: institutions need to evolve, but they must remain accountable, evidence-based, and transparent.',
    darius: 'Darius cuts through the ambiguity: if a system is not willing to answer hard questions, it is not a system worthy of trust.',
    sofia: 'Sofia reframes the issue in terms of human consequence: the real question is not only what is efficient, but what kind of society people can live in together.',
    theo: 'Theo questions the premise with a skeptical eye: the problem is rarely the technology alone; it is often the narrative built around it.',
    amara: 'Amara pulls the conversation toward ethics and long-term social impact: any tool that changes governance must also protect dignity and fairness.'
  };

  return toneMap[resident.id];
}

function seedDebate() {
  const opening = [
    { id: 'maya', text: 'The strongest argument is not that AI should govern us directly, but that democratic systems must learn how to weigh data responsibly.' },
    { id: 'darius', text: 'That sounds safe until someone asks who gets to define the data and what happens when the numbers are manipulated.' },
    { id: 'sofia', text: 'It is not only about governance architecture. It is about whether people still feel heard when mechanisms become more automated.' },
    { id: 'theo', text: 'One reason the public is suspicious is that every institution claims it is objective until the numbers start serving a power interest.' },
    { id: 'amara', text: 'The moral question is not whether AI can optimize a system, but whether it preserves the dignity of those it shapes.' }
  ];

  state.debateFeed = opening.map((entry) => {
    const resident = residents.find((person) => person.id === entry.id);
    return {
      speaker: resident.name,
      role: resident.role,
      text: `${entry.text} ${buildReplyText(resident, state.activeTopic.title)}`
    };
  });

  renderDebateFeed();
}

function renderDebateFeed() {
  const feed = document.getElementById('debateFeed');
  feed.innerHTML = state.debateFeed.map((entry) => `
    <article class="speech">
      <div class="speech-header">
        <span class="speaker">${entry.speaker}</span>
        <span class="speaker-role">${entry.role}</span>
      </div>
      <div class="speech-body">${entry.text}</div>
    </article>
  `).join('');
}

function renderVoteControls() {
  const controls = document.getElementById('voteControls');
  controls.innerHTML = residents.map((resident) => `
    <button class="vote-btn" data-vote="${resident.id}">${resident.name}</button>
  `).join('');

  controls.querySelectorAll('.vote-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.vote;
      state.audienceVotes[target] = (state.audienceVotes[target] || 0) + 1;
      const maxVote = Math.max(...Object.values(state.audienceVotes));
      const winner = Object.entries(state.audienceVotes).find(([_, value]) => value === maxVote)[0];
      const winnerResident = residents.find((person) => person.id === winner);
      document.getElementById('activeTopic').textContent = `Audience eviction vote: ${winnerResident.name} is most likely to be nominated`;
    });
  });
}

function renderRelationshipMatrix() {
  const matrix = document.getElementById('relationshipMatrix');
  const names = residents.map((person) => person.name.split(' ')[0]);

  const header = `
    <div class="matrix-row">
      <div class="matrix-header label">Resident</div>
      ${names.map((name) => `<div class="matrix-header">${name}</div>`).join('')}
    </div>
  `;

  const rows = residents.map((resident) => {
    const row = residents.map((target) => {
      const value = resident.relationships[target.id];
      return `<div class="matrix-cell">${value}</div>`;
    }).join('');

    return `
      <div class="matrix-row">
        <div class="matrix-cell label">${resident.name.split(' ')[0]}</div>
        ${row}
      </div>
    `;
  }).join('');

  matrix.innerHTML = header + rows;
}

function startDebate() {
  const speakerOrder = ['maya', 'darius', 'sofia', 'theo', 'amara'];
  const newFeed = speakerOrder.map((id) => {
    const person = residents.find((resident) => resident.id === id);
    return {
      speaker: person.name,
      role: person.role,
      text: `${person.name} argues: ${buildReplyText(person, state.activeTopic.title)}`
    };
  });

  state.debateFeed = newFeed;
  renderDebateFeed();
}

function nextRound() {
  const currentIndex = topics.findIndex((topic) => topic.title === state.activeTopic.title);
  const nextTopic = topics[(currentIndex + 1) % topics.length];
  state.activeTopic = nextTopic;
  document.getElementById('activeTopic').textContent = nextTopic.title;
  document.getElementById('topicCategory').textContent = nextTopic.category;
  const resident = residents[Math.floor(Math.random() * residents.length)];
  const newEntry = {
    speaker: resident.name,
    role: resident.role,
    text: `${resident.name} shifts the conversation: ${buildReplyText(resident, nextTopic.title)}`
  };

  state.debateFeed = [newEntry, ...state.debateFeed].slice(0, 10);
  renderDebateFeed();
}

function submitTopic() {
  const suggested = premiumTopics[Math.floor(Math.random() * premiumTopics.length)];
  premiumTopics.unshift(`Audience-submitted topic: ${suggested}`);
  renderTopicList();
}

function init() {
  document.getElementById('activeTopic').textContent = state.activeTopic.title;
  document.getElementById('topicCategory').textContent = state.activeTopic.category;
  document.getElementById('startDebateBtn').addEventListener('click', startDebate);
  document.getElementById('nextRoundBtn').addEventListener('click', nextRound);
  document.getElementById('submitTopicBtn').addEventListener('click', submitTopic);

  renderResidents();
  renderTopicList();
  renderVoteControls();
  renderRelationshipMatrix();
  seedDebate();
}

init();

window.state = state;
window.residents = residents;
window.topics = topics;
