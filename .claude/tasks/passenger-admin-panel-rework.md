# Busap – Passenger & Admin Panel Rework (Web)

## Context

Project: **busap**
Monorepo: pnpm + turborepo
Frontend: **Next.js (App Router)**
Backend: NestJS + Prisma (do not change unless required)
Scope: **WEB ONLY (`apps/web`)**

Documentation in `/docs` is the source of truth.

---

## Mandatory Rules (Read Carefully)

1. Read before coding:
   - `docs/REQUIREMENTS.md`
   - `docs/PLAN.md`
   - `docs/COMPANY_PANEL_CRUD.md`
   - `docs/DEVELOPMENT_STATUS.md`
2. Do **not** refactor unrelated code
3. Do **not** modify mobile app
4. Backend changes only if strictly necessary (explain why)
5. Work in **small, incremental steps**
6. After each phase, update progress in `/docs`
7. Stop and summarize work when token limits are near

---

## Goal

Rework **Passenger and Admin panels** to provide:
- consistent navigation between Routes, Stops, Companies
- rich internal linking (pages + modals)
- a new unified **Connections** concept
- preparation for future real-time and routing features

---

## Passenger Panel – Navigation Changes

### Remove
- Page: **Favorites**
- Page: **Dashboard**

### Rename
- `Search` → **Connections**
- **Connections** becomes the default passenger page

---

## Passenger Panel – New Pages

### 1. Routes

- search + filters
- user favorite routes displayed at the top
- route preview:
  - modal
  - dedicated route page
- route view contains:
  - map (Leaflet)
  - ordered list of stops
  - links:
    - stop page
    - or stop preview modal
- section: **Companies operating this route**
  - links to **internal company pages (panel view, not public)**

---

### 2. Stops

- search + filters
- favorite stops at the top
- stop preview:
  - modal
  - dedicated stop page
- stop view contains:
  - map
  - list of routes using this stop
  - links to:
    - route pages
    - or route preview modals
- section: **Companies using this stop**
  - internal panel view (read-only)
  - limited data:
    - company info
    - routes list with links

---

### 3. Companies

- search + filters
- favorite companies at the top
- company preview:
  - modal
  - dedicated company page
- company view contains:
  - basic company info (read-only)
  - routes list with links or modals

---

## Connections (Passenger)

- main passenger page
- connection = saved search parameters:
  - start stop
  - end stop
  - date / time (if available)
- allow:
  - saving connections as favorites
  - showing favorite connections directly under the search form
- connection details view:
  - departure and arrival times
  - operating company
  - map preview
  - stop list with timings

(Favorite connections are stored only for user convenience)

---

## Global Search & Filters

For all searchable pages add filters when data is available:
- country
- region / province
- city
- creation date
- last update date

---

## Admin & Superadmin Panel

### Connections
- add **Connections** page equivalent to passenger panel
- extended capabilities:
  - edit related resources
  - administrative data access

---

### Companies
- display companies as **table rows**
- actions according to admin/superadmin permissions

---

### Trips (Removal)

- remove **Trips** page
- trips are managed via:
  - schedules / timetables
  - accessible from **Routes**
- route editing for admin:
  - same or broader permissions than owner

---

## Map (All Panels)

Add global **Map** page:
- Leaflet-based
- dynamically load stops for visible map bounds
- clicking a stop:
  - opens preview modal
  - or navigates to stop page

---

## Navigation & Linking (Global Rule)

Every occurrence of:
- stop name
- route name
- company name

must be a **link** (page or modal) to the related resource.

---

## Execution Strategy

- Split work into **small phases**
- After each phase:
  - update `docs/PROGRESS.md` or `docs/DEVELOPMENT_STATUS.md`
- If interrupted:
  - clearly summarize completed work
  - describe the next step

---

## Expected Outcome

- coherent passenger experience
- strong internal linking between resources
- admin panel aligned with schedule-based architecture
- UX prepared for:
  - advanced routing
  - real-time data
  - delay estimation
