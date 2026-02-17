Work inside the existing Busap monorepo.
Assume openrouteservice is currently used via public API.
Goal is to become independent by running ORS locally.

Repository to use:
https://github.com/GIScience/openrouteservice

---

## GOAL
Run openrouteservice locally using Docker
and connect it to Busap backend as primary routing provider.

Public ORS API should remain as fallback.

---

## 1. ORS REPOSITORY INTEGRATION
Choose the most maintainable approach:
- Either Git submodule
- Or Docker-based integration without copying source

Goal:
- Stay up-to-date with upstream ORS changes
- Avoid manual syncing

Explain briefly why the chosen approach is best.

---

## 2. LOCAL ORS SETUP (DOCKER)
Add local ORS setup:
- Docker-based
- Configurable profiles (car routing required)
- Persistent data volumes
- Exposed HTTP API

Include:
- Required environment variables
- Minimal config needed for road routing
- Notes on map data (OSM PBF)

---

## 3. BUSAP ↔ ORS CONNECTION
Update Busap backend:
- Make routing provider configurable:
  - local ORS
  - public ORS (fallback)
- Switch via env variable
- No code duplication

Ensure:
- Same request/response abstraction
- No frontend changes required

---

## 4. DOCKER COMPOSE
If applicable:
- Extend existing docker-compose
- Add ORS service
- Network it with Busap API

ORS must be accessible only internally (not public).

---

## 5. VALIDATION
Add:
- Simple health check
- One example route request using local ORS

---

## OUTPUT RULES
Return ONLY:
1. Chosen integration strategy (1–2 sentences)
2. Files to add/modify (paths)
3. Docker / compose snippets
4. Backend config changes
5. Example ORS request

No explanations.
No tutorials.
No copy of upstream docs.
