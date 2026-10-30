# GEPETO PUPPET MASTER

Autonomous AI Reality — Multi-Model Villa Competition

This repository now contains a working MVP for the GEPETO PUPPET MASTER concept with:

- a browser-based villa dashboard
- a lightweight backend API
- five distinct resident personas
- a debate engine and vote flow
- premium topic submission logic
- transparent AI disclosure and admin surfaces

## Run locally

```bash
npm install
npm start
```

Then open:

- http://localhost:3000/
- http://localhost:3000/admin.html
- http://localhost:3000/transparency.html

## Current system capabilities

### Option 1: Advanced frontend experience
- interactive villa dashboard
- resident roster with provider labels
- live debate feed
- relationship matrix
- audience voting and topic queue

### Option 2: Backend and data simulation
- API endpoints for villa, debate, vote, admin, and transparency data
- in-memory resident memory and provider configuration
- moderator and admin state management

### Option 3: Architecture and production planning
- modular platform design
- transparent disclosure of fictional AI personas
- readiness for provider gateway integration, persistent DB, and broadcast layers

## Project structure

```text
.
├── README.md
├── ARCHITECTURE.md
├── package.json
├── server.js
└── public/
    ├── index.html
    ├── admin.html
    ├── transparency.html
    ├── styles.css
    └── app.js
```

## Notes

This is an MVP and intentionally simulates the AI integration boundary while clearly separating fictional character design from the provider layer. It is designed to be extended toward real model APIs, persistent storage, and a real 3D/broadcast pipeline.
