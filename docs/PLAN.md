# Busap - Plan rozwoju

## Status: FAZY 1-5 ZREALIZOWANE
Ostatnia aktualizacja: 2026-02-04

---

## Faza 1: Fundament - Role i schemat [ZREALIZOWANE]

### 1.1 Dodanie roli Admin do systemu
- [x] ETA Engine - juz zaimplementowany (service + controller + Redis cache)
- [x] Dodanie roli ADMIN do shared/constants
- [x] Aktualizacja Prisma schema (model Invitation, pole systemRole w User)
- [ ] Migracja bazy danych (wymaga uruchomienia `prisma migrate dev`)
- [x] Aktualizacja RolesGuard - obsluga admin vs superadmin
- [x] Zabezpieczenie: admin nie moze usunac superadmin

### 1.2 Backend - modul administracyjny
- [x] AdminModule z AdminController i AdminService
- [x] Endpointy zarzadzania uzytkownikami (CRUD + filtrowanie + paginacja)
- [x] System zaproszen email (model Invitation, generowanie tokenow)
- [x] Endpoint rejestracji przez zaproszenie (POST /admin/invitations/accept)
- [x] Endpointy zarzadzania rolami firmowymi
- [x] Dashboard ze statystykami systemowymi

### 1.3 Migracja i seedowanie
- [x] Seed script z kontem superadmin + demo company + demo route
- [ ] Uruchomienie migracji (wymaga `docker compose up` + `prisma migrate dev`)

---

## Faza 2: Panel administracyjny - Web UI [ZREALIZOWANE]

### 2.1 Layout i nawigacja
- [x] Nowy route group /(admin) z dedykowanym layoutem
- [x] Sidebar z nawigacja: Dashboard, Uzytkownicy, Zaproszenia, Firmy, Przystanki, Trasy, Pojazdy, Kursy, Symulator, Logi audytu
- [x] Guard - dostep tylko dla admin/superadmin (sprawdzanie systemRole)
- [x] Link do panelu admina w dashboardzie uzytkownika

### 2.2 Strony panelu
- [x] Dashboard z statystykami systemowymi (6 kartek + szybkie akcje)
- [x] Lista uzytkownikow z filtrowaniem, paginacja, wyszukiwaniem
- [x] Modal tworzenia uzytkownika z formularzem
- [x] Modal edycji uzytkownika z zarzadzaniem rolami
- [x] Lista zaproszen z filtrowaniem (pending/accepted/expired)
- [x] Modal tworzenia zaproszenia z kopiowaniem linku
- [x] Lista firm z CRUD (grid view z kartami)
- [x] Lista przystankow z widokiem tabeli i mapy OSM
- [x] Lista tras
- [x] Lista pojazdow
- [x] Lista kursow z filtrowaniem po statusie
- [x] Logi audytu z filtrowaniem po typie encji

### 2.3 Komponenty wspolne
- [x] Modalne okna dialogowe (create/edit)
- [x] Badge komponent dla statusow i rol
- [x] Tabele z paginacja
- [x] Formularze z walidacja
- [ ] Toast notifications (do dodania)
- [ ] DataTable z sortowaniem (do rozbudowy)

---

## Faza 3: Mapy OSM [ZREALIZOWANE]

### 3.1 Komponenty mapowe
- [x] BusapMap - bazowy komponent mapy OSM/Leaflet (dynamic import, SSR-safe)
- [x] MapInner - wewnetrzny renderer z TileLayer OSM
- [x] StopMarker - marker przystanku z popup (niebieska kropka)
- [x] RoutePolyline - wizualizacja trasy (polyline z kolorem i tooltip)
- [x] BusMarker - marker autobusu z kierunkiem jazdy (czerwony z ikona busa)
- [x] ClickHandler - obsluga klikniec na mapie

### 3.2 Widoki mapowe
- [x] Mapa przystankow w panelu admin (widok list/map toggle)
- [x] Mapa symulacji z pozycjami autobusow i trasami
- [ ] Mapa trasy (wizualizacja + edycja kolejnosci przystankow) - do rozbudowy
- [ ] Mapa pasazera (wyszukiwanie + ETA) - do rozbudowy

---

## Faza 4: Symulator pojazdu [ZREALIZOWANE]

### 4.1 Backend symulatora
- [x] SimulatorModule z SimulatorService i SimulatorController
- [x] Logika ruchu wzdluz trasy (interpolacja miedzy przystankami)
- [x] Raportowanie pozycji GPS (zapis do DB + Redis cache + pub/sub)
- [x] Konfiguracja: predkosc (1-100x), interwaly, losowe odchylenia
- [x] Start/pause/resume/stop symulacji
- [x] Automatyczne oznaczenie trip jako in_progress/completed

### 4.2 Frontend symulatora
- [x] Strona /admin/simulator z mapa OSM
- [x] Panel kontrolny: wybor kursu, slider predkosci i interwalow
- [x] Start/pauza/wznow/stop symulacji
- [x] Wizualizacja ruchu na mapie w czasie rzeczywistym (polling)
- [x] Podglad trasy przed rozpoczeciem symulacji (dashed line)
- [x] Statystyki symulacji (predkosc, kierunek, segment, czas)

---

## Faza 5: Upload plikow [ZREALIZOWANE]

### 5.1 Frontend - infrastruktura
- [x] Metoda `refreshUser()` w AuthContext (odswiezanie danych usera po zmianie avatara)
- [x] Metoda `uploadFile()` w ApiClient (multipart/form-data, automatyczny boundary)

### 5.2 Upload avatara (strona profilu)
- [x] Okragly avatar z inicjalami jako fallback
- [x] Overlay z ikona Camera i tekstem "Zmien" on hover
- [x] Hidden file input z accept="image/*"
- [x] Handler: upload -> PATCH /users/me -> refreshUser()
- [x] Stan ladowania i komunikaty bledow

### 5.3 Upload zdjecia pojazdu (admin panel)
- [x] Kolumna "Zdjecie" w tabeli pojazdow (miniaturka 32x32 lub ikona Truck)
- [x] Przycisk Edit otwierajacy VehicleEditModal
- [x] VehicleEditModal: formularz edycji z wszystkimi polami
- [x] Sekcja upload zdjecia z preview 64x64
- [x] Submit: PUT /vehicles/:id z photoUrl

### 5.4 Upload logo firmy (admin panel)
- [x] Logo firmy w grid kartach (zamiast ikony Building2 jesli dostepne)
- [x] Sekcja upload logo w CompanyFormModal (create i edit)
- [x] Preview logo 56x56 z fallback na ikone Building2
- [x] logoUrl w form state i request body

### 5.5 Backend (istniejacy)
- [x] StorageModule (local filesystem + Cloudflare R2 ready)
- [x] POST /storage/upload/avatar
- [x] POST /storage/upload/vehicle-photo
- [x] POST /storage/upload/company-logo
- [x] Walidacja typow: image/jpeg, image/png, image/webp, image/gif, application/pdf

---

## Pliki kluczowe (nowo utworzone)

### Backend (apps/api/src/modules/)
- `admin/admin.module.ts` - modul admin
- `admin/admin.service.ts` - serwis admin (users CRUD, invitations, roles, stats)
- `admin/admin.controller.ts` - kontroler admin (12 endpointow)
- `admin/dto/*.dto.ts` - DTOs (create-user, update-user, create-invitation, accept-invitation, assign-role)
- `simulator/simulator.module.ts` - modul symulatora
- `simulator/simulator.service.ts` - logika symulacji (tick, interpolacja, GPS pub/sub)
- `simulator/simulator.controller.ts` - kontroler symulatora (7 endpointow)

### Frontend (apps/web/src/)
- `app/(admin)/layout.tsx` - layout panelu admin z sidebar
- `app/(admin)/admin/page.tsx` - dashboard admina
- `app/(admin)/admin/users/page.tsx` - zarzadzanie uzytkownikami
- `app/(admin)/admin/invitations/page.tsx` - zarzadzanie zaproszeniami
- `app/(admin)/admin/companies/page.tsx` - zarzadzanie firmami (+ logo upload)
- `app/(admin)/admin/stops/page.tsx` - zarzadzanie przystankami (lista + mapa)
- `app/(admin)/admin/routes/page.tsx` - przeglad tras
- `app/(admin)/admin/vehicles/page.tsx` - przeglad pojazdow (+ edit modal + photo upload)
- `app/(admin)/admin/trips/page.tsx` - przeglad kursow
- `app/(admin)/admin/audit/page.tsx` - logi audytu
- `app/(admin)/admin/simulator/page.tsx` - symulator pojazdu z mapa
- `components/map/MapContainer.tsx` - komponent mapy (dynamic import)
- `components/map/MapInner.tsx` - wewnetrzny renderer mapy
- `components/map/StopMarker.tsx` - marker przystanku
- `components/map/BusMarker.tsx` - marker autobusu
- `components/map/RoutePolyline.tsx` - polyline trasy
- `components/map/index.ts` - eksporty komponentow mapowych

### Shared (packages/shared/src/)
- Dodano role ADMIN do constants
- Dodano typy Invitation, CreateInvitationInput do types/user.ts
- Dodano walidatory: createInvitationSchema, acceptInvitationSchema, adminCreateUserSchema

### Schema (apps/api/prisma/)
- Dodano pole systemRole do User
- Dodano model Invitation
- Dodano seed.ts (superadmin + demo data)

---

## Nastepne kroki (do zrealizowania)

### Priorytet wysoki
1. Uruchomienie migracji Prisma i seedowania
2. Testy integracyjne admin API
3. Wysylka email z zaproszeniami (integracja z serwisem email)
4. Toast notifications w UI
5. Rozbudowa mapy pasazera (wyszukiwanie + real-time tracking)

### Priorytet sredni
6. Formularz tworzenia/edycji tras z mapa (drag & drop stops)
7. Formularz tworzenia/edycji kursow
8. Raporty dla managera (punktualnosc, statystyki)
9. i18n - obsluga 8 jezykow (pl, en, ua, de, fr, es, cs, sk)
10. Offline support dla mobile (SQLite + sync queue)

### Priorytet niski
11. Landing page z grafikami i marketingiem
12. Dark mode improvements
13. Mobile app - integracja z mapami (react-native-maps)
14. SaaS billing preparation (Stripe, plany cenowe, limity)
15. PWA support dla web (service worker, push notifications)
16. CI/CD pipeline (GitHub Actions, Docker build, auto-deploy)

---

## Notatki techniczne

### Architektura backendu
- NestJS z modularnym podejsciem
- Prisma ORM z PostgreSQL
- Redis do cache ETA/GPS i pub/sub (realtime)
- JWT auth z rotacja refresh tokenow + systemRole w payload
- Socket.io do WebSocket (realtime pozycje)
- Storage: local filesystem (dev) + Cloudflare R2 (prod)

### Architektura frontendu (web)
- Next.js 14+ z App Router
- Tailwind CSS + shadcn/ui pattern (Radix UI)
- React Context do auth
- react-leaflet do map (dynamic import, SSR-safe)
- Lucide React do ikon

### Istniejace moduly backendowe (ZAIMPLEMENTOWANE)
- AuthModule (JWT + bcrypt + refresh token rotation + systemRole)
- UsersModule (CRUD + role management)
- CompaniesModule (CRUD + stats)
- StopsModule (CRUD + geo-search)
- RoutesModule (CRUD + versioning + exceptions)
- TripsModule (CRUD + lifecycle + search)
- VehiclesModule (CRUD + availability)
- PricingModule (CRUD + calculation)
- EtaModule (schedule + GPS + historical)
- GpsModule (position reporting + Redis cache + history)
- AuditModule (logging + search)
- RealtimeModule (WebSocket gateway + Redis pub/sub)
- StorageModule (local filesystem + R2 ready)
- AdminModule (users CRUD + invitations + roles + dashboard)
- SimulatorModule (vehicle simulation + GPS reporting)
