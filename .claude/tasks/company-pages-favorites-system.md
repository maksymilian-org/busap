GOAL:
Implement Public Company Page + Favorites + Company News with minimal changes and maximal reuse.

---

### 1. Public Company Page
URL:
- /[companySlug] (e.g. busap.pl/superbusco)

Page sections (top → bottom):
1. Nearest upcoming departures (with countdown: “in X min”)
2. Company info (name, logo, description)
3. Routes operated by the company
4. Company News

SEO-friendly, slug-based routing.

---

### 2. Company News
- Entity: CompanyNews (belongs to Company)
- Roles allowed to manage: owner, manager
- CRUD available in **Company Panel**
- Visible on:
  - Public company page
  - Passenger dashboard (latest only)
  - Passenger News page (full list, sidebar link)

---

### 3. Favorites (Passenger)
Passenger can favorite:
- Companies
- Routes
- Stops

Dashboard (compact widgets):
- Latest news from favorited companies
- Nearest departures from:
  - favorited routes
  - favorited stops

Dedicated pages:
- Favorites → Companies
- Favorites → Routes
- Favorites → Stops
- Favorites → Departures

---

### 4. Backend (NestJS + Prisma)
Add only what is required.

Models:
- Company (ensure slug)
- CompanyNews
- FavoriteCompany
- FavoriteRoute
- FavoriteStop

Endpoints:
- Public:
  - GET /companies/:slug
  - GET /companies/:slug/routes
  - GET /companies/:slug/departures
  - GET /companies/:slug/news
- Passenger:
  - POST /favorites/{company|route|stop}/:id
  - DELETE /favorites/{company|route|stop}/:id
  - GET /favorites/dashboard
- Company Panel:
  - CRUD /company/news

Enforce RBAC using existing auth/guards.

---

### 5. Frontend (Web + Mobile)
- Reuse existing UI patterns
- No new design system
- Shared types from /packages/shared

Web:
- Public company page (slug route)
- Passenger dashboard widgets
- News page (sidebar)
- Favorites pages
- Company panel → News CRUD

Mobile:
- Same feature scope, simplified UI where needed

---

### 6. Output Format (IMPORTANT)
Return ONLY:
1. Data model changes (Prisma)
2. New/changed API endpoints (paths + purpose)
3. File-level changes (what to add/modify, where)
4. Key logic snippets ONLY where non-trivial
5. Migration notes (if any)

NO explanations, NO theory, NO repetition.

Think incrementally. Reuse existing code.
