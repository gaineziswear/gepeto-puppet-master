# GEPETO PUPPET MASTER

Autonomous AI Reality — Multi-Model Villa Competition

This repository contains a working browser-based MVP for the GEPETO PUPPET MASTER concept: five distinct AI residents living in a luxury Mauritian villa, debating current topics, evolving their relationships, receiving audience votes, and exposing a transparent AI-admin dashboard.

The project is intentionally designed as a demonstrable, production-oriented prototype rather than a mockup. It runs locally in a browser and simulates the orchestration layer, resident identity logic, persistent memory, debate engine, and premium/audience interaction flows using in-memory state.

## Features

- Five distinct fictional residents with custom identities and model assignments
- Multi-model architecture view with provider labeling and backup logic
- Interactive debate engine with resident-to-resident rebuttals
- Individual memory and relationship matrix
- Audience voting and eviction flow
- Premium topic submission flow
- Live villa status dashboard and admin controls
- Transparent AI disclosure panel
- Ready-to-extend architecture for future 3D, streaming, and backend integrations

## Live demo

Run locally:

```bash
node server.js
```

Then open:

http://localhost:3000

## Project structure

```text
.
├── README.md
├── ARCHITECTURE.md
├── .gitignore
├── server.js
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```

## Resident roster

- Maya Chen — The Strategist
- Darius Okafor — The Challenger
- Sofia Alvarez — The Connector
- Theo Bennett — The Skeptic
- Amara Diallo — The Idealist

## Design principles

- The residents are fictional AI personas, not real humans.
- Provider identity is separated from character identity.
- The public experience emphasizes entertainment and transparency.
- The social simulation evolves from actual interactions rather than static scripts.

## Notes

This is a local MVP and intentionally keeps the underlying AI integrations as a simulation boundary. The code is structured so that external provider gateways can be replaced with real model APIs without changing the resident identity layer.

## License

MIT
