# GEPETO PUPPET MASTER

Autonomous AI Reality — Multi-Model Villa Competition

This repository contains a working browser-based MVP for the GEPETO PUPPET MASTER concept. The project now includes a lightweight backend API and a richer interactive frontend that simulate the villa environment, resident debate engine, voting, and transparency layer.

## Features

- Five distinct fictional residents with custom personalities and model assignments
- Multi-model architecture with explicit provider identities and failover simulation
- Public debate engine with resident-to-resident rebuttals
- Persistent in-memory resident memory and relationship matrix
- Premium topic queue and audience voting flow
- Live villa dashboard and admin-style monitoring layer
- AI/Provider transparency panel
- Backend API for residents, topic selection, debate events, and votes

## Run locally

```bash
node server.js
```

Then open:

http://localhost:3000

## API endpoints

- GET /api/health
- GET /api/villa
- GET /api/residents
- GET /api/topics
- GET /api/debate
- POST /api/debate/run
- POST /api/vote
- POST /api/topic

## Notes

This implementation intentionally keeps the AI integration boundary simulated while making the architecture ready for real provider gateways, database persistence, and 3D broadcast expansion.

## License

MIT
