Work inside the existing Busap monorepo.
Do NOT redesign architecture.
Reuse existing auth, roles, UI patterns, and data models wherever possible.

GOAL:
Implement Driver Panel (WEB only).

---

## 1. DRIVER ROLE
Assume role already exists or extend existing roles minimally:
- driver
- owner / manager must be able to view driver schedules

Respect existing RBAC patterns.

---

## 2. DRIVER PANEL – CORE FEATURES

### A. Assigned Courses
Driver can:
- View assigned courses
- See course details:
  - route
  - stops
  - departure / arrival times
  - estimated duration
- See countdown to next course (“starts in X min / h”)

Driver CANNOT edit course structure.

---

### B. Vehicles
Driver can:
- View vehicles assigned to their courses
- See vehicle details

Assignment rules:
- Vehicle assignment can be:
  - preassigned by owner/manager
  - or assigned to course by driver (if allowed by existing permissions)

Follow current vehicle–course logic.

---

### C. Schedule (Grafik Pracy)
Driver schedule view:
- Daily / Weekly / Monthly
- Shows:
  - assigned courses per day
  - summed estimated working time:
    - per day
    - per week
    - per month
    - per year

Use existing course duration logic (or estimatedDuration if present).

---

## 3. COMPANY VIEW (OWNER / MANAGER)
Owner / manager can:
- View schedules of all drivers
- Filter by:
  - driver
  - date range
- See summed working time per driver:
  - day / week / month

Read-only.

---

## 4. DASHBOARD (DRIVER)
Driver dashboard widgets:
- Upcoming courses (next 24h)
- Countdown to next course
- Today’s total working time

Compact layout.
No analytics.

---

## 5. BACKEND
Extend or reuse existing endpoints.
Add only what is required.

Likely needs:
- GET /driver/courses
- GET /driver/schedule
- GET /company/drivers/schedules

No breaking API changes.

---

## 6. FRONTEND (WEB ONLY)
- New Driver Panel entry in sidebar
- Pages:
  - Dashboard
  - Courses
  - Schedule

Reuse existing components and layout system.

---

## 7. OUTPUT RULES (IMPORTANT)
Return ONLY:
1. Required backend changes (endpoints + purpose)
2. Data used for schedule calculations
3. Frontend pages/components to add (file paths)
4. Any assumptions made (short list)

NO explanations.
NO UX descriptions.
NO future features.
