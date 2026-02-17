Work inside the existing Busap monorepo.
Use Leaflet (already used in the project).

GOAL:
Add a Satellite map mode, fully free and production-safe.

---

## REQUIREMENTS

Map layers:
1. Street (default)
   - OpenStreetMap tiles
2. Satellite
   - Esri World Imagery tiles
   - No API key
   - Legal for production use

Add:
- Layer switcher (Street / Satellite)
- Use Leaflet native controls
- Keep existing map behavior unchanged

---

## TILE SOURCES

Street:
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

Satellite:
https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}

---

## IMPLEMENTATION RULES

- Reuse existing map component
- Do NOT introduce new map libraries
- Abstract layers to allow future replacement
- Max zoom: 19 for satellite
- Correct attribution required

---

## OPTIONAL (IF EASY)
- Persist selected map mode per user (localStorage / state)
- Same behavior on Web and Mobile if applicable

---

## OUTPUT RULES
Return ONLY:
1. Files to modify
2. Code snippets for layers + switcher
3. Attribution text used

No explanations.
No comparisons.
