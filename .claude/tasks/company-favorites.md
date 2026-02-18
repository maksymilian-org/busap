Work inside the existing Busap monorepo.
Do NOT redesign architecture.
Reuse existing models, auth, and RBAC.

GOAL:
Ensure all stops and routes are visible to all employees of a company with proper ownership, favorites, and visibility rules.

---

## 1. DATA MODEL UPDATES
Each stop and route must store:
- author (user who created it)
- createdAt timestamp

Existing company favorite system must be reused:
- Owner / Manager can mark stops/routes as company favorites
- Any route/stop created by a company employee is automatically added to company favorites

---

## 2. VISIBILITY RULES
- All employees of a company can see:
  - All stops
  - All routes
- Initial filter on list pages:
  - Show only company favorites first
  - User can toggle to see all

- Routes/stops created by an employee:
  - Visible to all employees in **other companies**
  - Automatically added to **creator’s company favorites**

---

## 3. BACKEND
- Ensure API returns author info with stops/routes
- Update POST /routes and POST /stops:
  - Set author = current user
  - Auto-add to company favorites if creator is employee
- Add GET filters:
  - Favorites only (default)
  - All
- Permissions:
  - Any employee can read all stops/routes
  - Only owner/manager can mark/unmark company favorites manually

---

## 4. FRONTEND
- List pages for stops/routes:
  - Default: show company favorites
  - Toggle: show all
- Display author for each stop/route
- Indicate if route/stop is a company favorite
- Owner/manager can mark/unmark favorites
- No changes to mobile required yet

---

## 5. OUTPUT RULES
Return ONLY:
1. Data model changes (Prisma / DB)
2. Backend changes (endpoints, filters, favorite logic)
3. Frontend pages/components to modify (file paths)
4. Any assumptions (short list)

NO explanations.
NO UX copy.
NO unrelated features.
