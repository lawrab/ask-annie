# Architectural Decision Records

## ADR-001: Podman Instead of Docker
**Date:** 2024-01-25
**Status:** Accepted
**Context:** Development on NixOS, rootless containers preferred
**Decision:** Use Podman with podman-compose
**Consequences:** 
- Better security (rootless)
- Native NixOS integration
- Must use Podman-specific commands in docs

## ADR-002: JWT in HTTP-only Cookies
**Date:** 2024-01-20
**Status:** Accepted (Issue #52)
**Context:** XSS vulnerability with localStorage tokens
**Decision:** Store JWT in HTTP-only secure cookies
**Consequences:**
- Better security against XSS
- CSRF protection needed
- Slightly more complex auth flow

## ADR-003: Dynamic Symptom Schema
**Date:** 2024-01-15
**Status:** Accepted
**Context:** Users have unpredictable symptom variations
**Decision:** Use flexible MongoDB documents, not rigid SQL schema
**Consequences:**
- Can capture any new symptom mentioned
- Requires AI parsing layer
- More complex trend analysis

## ADR-004: faster-whisper Over OpenAI Whisper
**Date:** 2024-01-10
**Status:** Accepted
**Context:** Need local voice transcription
**Decision:** Use faster-whisper (optimized Whisper)
**Consequences:**
- Faster transcription (2-4x speedup)
- Runs locally (privacy benefit)
- Slightly larger memory footprint
