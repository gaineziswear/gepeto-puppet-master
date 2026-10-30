# GEPETO PUPPET MASTER — Implementation Architecture

This repository implements a production-oriented MVP of the "Autonomous AI Reality — Multi-Model Villa Competition" concept as a browser-driven simulation.

## Architectural focus

The implementation is split into a few deliberately clear layers:

1. Public audience layer
   - Villa status board
   - Debate feed
   - Resident profiles
   - Vote and eviction controls
   - Premium topic queue

2. Resident simulation layer
   - Resident personality definitions
   - Relationship matrix
   - Memory tracking
   - Debate response generation

3. Administration layer
   - Model provider mapping
   - Cost and token budget simulation
   - Resident management and voting controls
   - Broadcast and villa oversight

4. Transparency layer
   - Explicit AI disclosures
   - Provider/model mapping visibility
   - Distinction between fictional persona and underlying model API

## Core simulation model

Each resident has:

- name
- role
- personality description
- provider assignment
- model version
- memory
- opinions
- relationship scores to other residents
- debate style

The simulation does not train or create actual foundation models. Instead, it treats each resident as a fictional character orchestrated through a provider abstraction.

## Runtime behaviour

The app operates in memory and supports:

- selecting active debate topics
- generating resident rebuttals and new lines
- updating memory and relationship tension.
- counting audience votes
- evicting residents and replacing them with a new character stub
- premium and public submission flows

## Extension path

For a full production build, this can grow into:

- 3D villa in Unreal Engine or Three.js
- real AI provider gateway with official SDKs
- persistent Postgres or MongoDB state
- WebSocket realtime updates
- RTMP/OBS broadcasting pipeline
- secure RBAC admin console
- Patreon or subscription verification service

## Constraints of this MVP

- No real external model calls are performed.
- No persistent database is used.
- No live stream integration is configured.
- The visual presentation is browser-based rather than full 3D.

These constraints are intentional and are clearly marked in the app to remain transparent with users.
