# Busap - Status realizacji

## Ostatnia aktualizacja: 2026-02-05

---

## Podsumowanie postepow

| Faza | Status | Postep |
|------|--------|--------|
| Faza 1: Role + Backend admin | Zrealizowane | 95% (brak migracji) |
| Faza 2: Panel admin Web UI | Zrealizowane | 100% |
| Faza 3: Mapy OSM | Zrealizowane | 100% |
| Faza 4: Symulator pojazdu | Zrealizowane | 100% |
| Faza 5: Upload plikow | Zrealizowane | 100% |
| Faza 6: Toast + Mapa pasazera + Email | Zrealizowane | 100% |

---

## Szczegolowy log zmian

### 2026-02-04

#### Sesja 1 (poprzednia - limit tokenow)
- [x] Migracja z Appwrite na wlasny JWT auth
- [x] Token service z rotacja refresh tokenow
- [x] Realtime gateway (Socket.io + Redis pub/sub)
- [x] Storage module (local + R2 interface)
- [x] Mobile: Expo managed workflow, Zustand store, secure storage
- [x] Web: API client, auth context
- [x] Wszystkie moduly backendowe zaimplementowane (ETA, GPS, Companies, Stops, Routes, Trips, Vehicles, Pricing, Audit)
- [x] Usuniecie Appwrite, uproszczenie Docker

#### Sesja 2
- [x] Analiza stanu repozytorium
- [x] Utworzenie dokumentacji planow (docs/PLAN.md, docs/REQUIREMENTS.md, docs/PROGRESS.md)
- [x] Faza 1.1: Dodanie roli Admin do shared/constants i validators
- [x] Faza 1.1: Aktualizacja Prisma schema (systemRole, model Invitation)
- [x] Faza 1.1: Aktualizacja RolesGuard (obsluga admin vs superadmin via systemRole)
- [x] Faza 1.1: Aktualizacja TokenService (systemRole w JWT payload)
- [x] Faza 1.1: Aktualizacja AuthService (systemRole w token generation)
- [x] Faza 1.2: AdminModule - AdminService (users CRUD, invitations, company roles, dashboard stats)
- [x] Faza 1.2: AdminController (12 endpointow REST)
- [x] Faza 1.2: DTOs (5 klas walidacyjnych)
- [x] Faza 1.3: Seed script (superadmin + demo company + demo route + demo stops)
- [x] Faza 2.1: Admin layout z sidebar i nawigacja (10 pozycji menu)
- [x] Faza 2.2: Admin dashboard ze statystykami (6 kart + quick actions)
- [x] Faza 2.2: Users page (lista, search, paginacja, create modal, edit modal)
- [x] Faza 2.2: Invitations page (lista, filtry status, create modal z kopiowaniem linku)
- [x] Faza 2.2: Companies page (grid cards, create/edit modals)
- [x] Faza 2.2: Stops page (tabela + mapa OSM z toggle)
- [x] Faza 2.2: Routes page (tabela)
- [x] Faza 2.2: Vehicles page (tabela)
- [x] Faza 2.2: Trips page (tabela z filtrami statusu)
- [x] Faza 2.2: Audit page (tabela z filtrami typu encji)
- [x] Faza 2.x: Link do panelu admina w dashboardzie (dla admin/superadmin)
- [x] Faza 3.1: BusapMap (dynamic import SSR-safe)
- [x] Faza 3.1: MapInner (TileLayer OSM, click handler)
- [x] Faza 3.1: StopMarker (niebieska kropka z popup)
- [x] Faza 3.1: BusMarker (czerwony marker z ikona busa i kierunkiem)
- [x] Faza 3.1: RoutePolyline (linia trasy z tooltip)
- [x] Faza 3.2: Mapa przystankow w admin stops page
- [x] Faza 3.2: Mapa symulacji w simulator page
- [x] Faza 4.1: SimulatorService (tick, interpolacja, GPS pub/sub, db persistence)
- [x] Faza 4.1: SimulatorController (7 endpointow)
- [x] Faza 4.2: Simulator page (mapa + panel kontrolny + polling)

#### Sesja 3
- [x] Faza 5.1: Metoda `refreshUser()` w AuthContext (odswiezanie danych usera po uploadzie)
- [x] Faza 5.2: Metoda `uploadFile()` w ApiClient (multipart/form-data, bez wymuszania Content-Type)
- [x] Faza 5.3: Upload avatara na stronie profilu (Camera overlay, preview, initials fallback)
- [x] Faza 5.4: VehicleEditModal z upload zdjecia pojazdu (formularz edycji + miniaturka w tabeli)
- [x] Faza 5.5: Upload logo firmy w CompanyFormModal (preview + wyswietlanie w grid kartach)
- [x] Faza 5.6: Aktualizacja dokumentacji (PROGRESS.md sesja 3, PLAN.md faza 5)

### 2026-02-05

#### Sesja 4
- [x] Bugfix: Logout - dodanie body do POST /auth/logout (Fastify wymaga body dla application/json)
- [x] Bugfix: Mapa Leaflet - wylaczenie reactStrictMode w next.config.ts (problem z podwojnym montowaniem)
- [x] Bugfix: z-index mapy - dodanie stylów CSS dla .leaflet-container i .leaflet-pane
- [x] Faza 6.1: Toast notifications - Toaster juz byl w Providers, dodano toasty do:
  - Login page (sukces + blad)
  - Register page (sukces + blad)
  - Profile page (avatar upload, save profile)
  - Admin users page (create, update, delete)
  - Admin invitations page (revoke, copy link)
  - Admin companies page (create, update)
  - Admin vehicles page (update, photo upload)
  - Admin stops page (create, update)
  - Admin simulator page (bledy)
- [x] Faza 6.2: Mapa pasazera - kompletna przebudowa passenger page:
  - Autocomplete wyszukiwanie przystankow (debounce, dropdown)
  - Wyszukiwanie kursow miedzy przystankami (GET /trips/search)
  - Lista wynikow z godzinami, firma, pojazdem, cena
  - Mapa OSM z trasa i przystankami dla wybranego kursu
  - Real-time GPS tracking dla kursow w_progress (polling 5s)
  - Szczegoly kursu (lista przystankow, info o pojezdzie)
- [x] Faza 6.3: Wysylka email dla zaproszen:
  - Nowa metoda sendInvitationEmail w MailerService (szablon HTML)
  - Integracja z AdminService.createInvitation (wysylka przy tworzeniu)
  - Nowy endpoint GET /admin/invitations/verify (weryfikacja tokena)
  - Aktualizacja strony /register - obsluga tokena z zaproszenia

---

## Nowe pliki utworzone w sesji 2

### Backend (30+ plikow)
```
apps/api/src/modules/admin/admin.module.ts
apps/api/src/modules/admin/admin.service.ts
apps/api/src/modules/admin/admin.controller.ts
apps/api/src/modules/admin/dto/create-user.dto.ts
apps/api/src/modules/admin/dto/update-user.dto.ts
apps/api/src/modules/admin/dto/create-invitation.dto.ts
apps/api/src/modules/admin/dto/accept-invitation.dto.ts
apps/api/src/modules/admin/dto/assign-role.dto.ts
apps/api/src/modules/simulator/simulator.module.ts
apps/api/src/modules/simulator/simulator.service.ts
apps/api/src/modules/simulator/simulator.controller.ts
apps/api/prisma/seed.ts
```

### Frontend (20+ plikow)
```
apps/web/src/app/(admin)/layout.tsx
apps/web/src/app/(admin)/admin/page.tsx
apps/web/src/app/(admin)/admin/users/page.tsx
apps/web/src/app/(admin)/admin/invitations/page.tsx
apps/web/src/app/(admin)/admin/companies/page.tsx
apps/web/src/app/(admin)/admin/stops/page.tsx
apps/web/src/app/(admin)/admin/routes/page.tsx
apps/web/src/app/(admin)/admin/vehicles/page.tsx
apps/web/src/app/(admin)/admin/trips/page.tsx
apps/web/src/app/(admin)/admin/audit/page.tsx
apps/web/src/app/(admin)/admin/simulator/page.tsx
apps/web/src/components/map/MapContainer.tsx
apps/web/src/components/map/MapInner.tsx
apps/web/src/components/map/StopMarker.tsx
apps/web/src/components/map/BusMarker.tsx
apps/web/src/components/map/RoutePolyline.tsx
apps/web/src/components/map/index.ts
```

### Dokumentacja
```
docs/PLAN.md
docs/REQUIREMENTS.md
docs/PROGRESS.md
```

### Zmodyfikowane pliki
```
packages/shared/src/constants/index.ts (dodano ADMIN)
packages/shared/src/validators/index.ts (dodano invitation/admin schemas)
packages/shared/src/types/user.ts (dodano systemRole, Invitation types)
apps/api/prisma/schema.prisma (systemRole, model Invitation)
apps/api/src/app.module.ts (dodano AdminModule, SimulatorModule)
apps/api/src/common/guards/roles.guard.ts (obsluga systemRole)
apps/api/src/modules/auth/auth.service.ts (systemRole w token)
apps/api/src/modules/auth/token.service.ts (systemRole w JWT)
apps/api/package.json (seed script)
apps/web/src/app/(dashboard)/layout.tsx (link do admin panelu)
```

## Zmodyfikowane pliki w sesji 3
```
apps/web/src/contexts/auth-context.tsx (dodano refreshUser)
apps/web/src/lib/api.ts (dodano uploadFile)
apps/web/src/app/(dashboard)/profile/page.tsx (avatar upload UI)
apps/web/src/app/(admin)/admin/vehicles/page.tsx (VehicleEditModal + photo column)
apps/web/src/app/(admin)/admin/companies/page.tsx (logo upload w modal + grid)
docs/PROGRESS.md (sesja 3)
docs/PLAN.md (faza 5)
```

---

## Co robic po wznowieniu sesji

1. Przeczytaj `docs/PLAN.md` - plan rozwoju z checklistami
2. Przeczytaj `docs/PROGRESS.md` - ten plik, co zrobione
3. Przeczytaj `docs/REQUIREMENTS.md` - wymagania biznesowe
4. Uruchom migracje: `cd apps/api && npx prisma migrate dev`
5. Uruchom seed: `cd apps/api && npx ts-node prisma/seed.ts`
6. Kontynuuj od "Nastepne kroki" w PLAN.md
