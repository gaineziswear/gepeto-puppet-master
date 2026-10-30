# GEPETO PUPPET MASTER — Architecture and Implementation Notes

## Overview

This project implements a production-oriented MVP for a fictional AI villa competition concept. The code is split into a public web app and a lightweight backend API that simulate the principal runtime flows without requiring real model access or a database.

## Layered architecture

### 1. Public audience layer
- Live villa dashboard
- Debate room
- Resident roster
- Vote controls
- Premium topic queue
- AI disclosure panel

### 2. Resident simulation layer
Each resident has:
- identity and role
- provider assignment
- model label
- memory notes
- relationship scores
- personality and debate style

### 3. Orchestration layer
The backend tracks:
- current debate topic
- feed of generated statements
- vote counts
- suggested premium topics
- resident state

### 4. Governance and transparency
The platform exposes:
- provider/model mapping
- AI disclosure notices
- separation between character identity and underlying backend model

## API design

The server provides JSON endpoints for:
- health checks
- submitting and retrieving debate state
- topic queue changes
- audience voting
- resident data access

This structure allows a future move to a persistent database or real provider services without redesigning the public app.

## Current limitations

- No real external model calls are made
- No production database or auth is configured
- No real-streaming or 3D engine integration yet
- The app intentionally operates in memory for local development and concept validation

## Next phases

1. Add real AI provider SDK integration
2. Expand to persistent Postgres storage
3. Add WebSocket updates for real-time feed syncing
4. Add an admin dashboard with override controls
5. Add 3D scene or broadcast layer

## Summary

The repository now demonstrates the key product concept and a functional runtime shell for a real GEPETO PUPPET MASTER build.
