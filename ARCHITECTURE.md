# GEPETO PUPPET MASTER — Architecture and Production Notes

## Summary

This repository demonstrates an operational MVP of the GEPETO PUPPET MASTER concept: an autonomous villa simulation in which five fictional AI residents debate topics, build relationships, receive audience votes, and are managed through a lightweight admin layer.

## Modular architecture

### 1. Public audience application
Used for:
- live villa view
- resident roster
- topic feed
- votes
- premium topic queue

### 2. Backend orchestration layer
Used for:
- maintaining current debate topic
- storing resident and provider state in memory
- handling vote results and topic submissions
- managing admin and transparency views

### 3. Resident simulation layer
Each resident includes:
- identity and character archetype
- model/provider assignment
- relationship map
- memory notes
- debate style

### 4. Admin and governance layer
Used for:
- provider assignment and failover modes
- token budget and latency status
- audience vote control
- eviction simulation and model status tracking

### 5. Transparency layer
Public pages explicitly state:
- residents are fictional AI personas
- providers are disclosed
- no real human is being impersonated
- the model layer is separate from character identity

## Runtime assumptions

The current implementation intentionally does not connect to live AI providers. Instead, it simulates the orchestration layer and represents an architecture that can be upgraded to real provider SDKs, a database, and a stream-ready broadcast pipeline.

## Next production steps

1. integrate real provider APIs behind a stable gateway
2. replace in-memory state with a database layer
3. add real-time WebSocket updates
4. add secure admin auth and RBAC
5. add 3D villa or broadcast composer integration
6. add subscription verification and premium entitlement enforcement

## Conclusion

The current branch is the foundation for a functional concept prototype and is suitable for further expansion toward a production-level AI reality show platform.
