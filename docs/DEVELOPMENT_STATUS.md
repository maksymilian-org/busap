# Busap - Status Developmentu

## Ostatnia aktualizacja: 2026-02-10

---

## Architektura

- **Monorepo** z pnpm workspaces
- **API**: NestJS + Fastify + Prisma + PostgreSQL
- **Web**: Next.js 15 + App Router + next-intl (i18n)
- **Mobile**: React Native + Expo (Android)
- **Baza danych**: PostgreSQL + Redis (sessions/cache)

---

## Ukończone funkcjonalności

### Autentykacja
- [x] Rejestracja użytkowników
- [x] Logowanie (email + hasło)
- [x] JWT tokens (access + refresh)
- [x] Weryfikacja email
- [x] Reset hasła
- [x] Role systemowe: passenger, admin, superadmin
- [x] Role firmowe: passenger, driver, manager, owner
- [x] **lastLoginAt** - timestamp ostatniego logowania (wymaga migracji!)

### Panel administracyjny (web)
- [x] Dashboard ze statystykami
- [x] Zarządzanie użytkownikami (CRUD)
- [x] System zaproszeń (email)
- [x] Zarządzanie firmami (CRUD)
- [x] **Zarządzanie członkami firm** (dodawanie, zmiana roli, usuwania)
- [x] **Edycja firmy na stronie szczegółów** (modal)
- [x] Przystanki - pełny CRUD + lista i mapa
- [x] Trasy - pełny CRUD
- [x] Pojazdy - pełny CRUD + file upload
- [x] Kursy - pełny CRUD
- [x] Symulator GPS
- [x] Logi audytu

### Panel firmy (web) - Manager/Owner
- [x] Dashboard firmy
- [x] **Pojazdy - pełny CRUD + file upload** (2026-02-10)
- [x] **Trasy - pełny CRUD** (2026-02-10)
- [x] **Kursy - pełny CRUD** (2026-02-10)
- [x] **Przystanki - pełny CRUD + lista i mapa** (2026-02-10)
- [x] Pracownicy (członkowie firmy)
- [x] Harmonogramy

### Internacjonalizacja (i18n)
- [x] Dwa języki: Polski (domyślny), Angielski
- [x] URL-based routing: `/pl/...`, `/en/...`
- [x] Language switcher w headerze
- [x] Tłumaczenia dla wszystkich stron admin
- [x] **Emaile z locale w URL** (np. `/pl/register?token=xxx`)

### Bezpieczeństwo
- [x] Admin nie może edytować superadmin users (frontend + backend)
- [x] Firma musi mieć minimum jednego ownera
- [x] CORS dla sieci lokalnej (development)

---

## Do wykonania po restarcie serwera

### Migracja bazy danych (lastLoginAt)
```bash
# Zatrzymaj serwer dev
# Następnie:
pnpm db:migrate
# lub
cd apps/api && npx prisma migrate dev --name add_last_login_at
```

---

## Dodane dzisiaj (2026-02-10)

| Funkcjonalność | Status | Opis |
|----------------|--------|------|
| Panel firmy - Pojazdy CRUD | ✅ | Dodano edit, delete i file upload dla zdjęć pojazdów |
| Panel firmy - Trasy CRUD | ✅ | Dodano edit i delete dla tras |
| Panel firmy - Kursy CRUD | ✅ | Dodano edit i delete dla kursów |
| Panel firmy - Przystanki | ✅ | Utworzono nową sekcję z pełnym CRUD, lista i mapa |
| i18n - tłumaczenia CRUD | ✅ | Dodano klucze PL/EN dla edycji i usuwania |
| Nawigacja - link Przystanki | ✅ | Dodano link do przystanków w menu panelu firmy |

---

## Planowane funkcjonalności

### WYSOKI PRIORYTET (następne)

1. **Zarządzanie trasami** - admin/superadmin powinni móc edytować/tworzyć trasy

### ŚREDNI PRIORYTET

2. **Wyszukiwanie przystanków w passenger** - poprawki UI

### NISKI PRIORYTET / PRZYSZŁOŚĆ

3. **"Zaloguj jako użytkownik"** (impersonation) - admin/superadmin mogą podglądać aplikację jako inny user
   - Wymaga: osobnego stanu sesji
   - NIE zapisuje lastLoginAt dla podglądanego usera
   - Cel: debugowanie problemów użytkowników
   - Implementacja:
     - Endpoint `POST /admin/impersonate/:userId` - tworzy tymczasowy token
     - Header `X-Impersonating-User: true` lub specjalny claim w JWT
     - Banner "Przeglądasz jako [user]" z przyciskiem powrotu

---

## Struktura katalogów (kluczowe)

```
apps/
  api/                    # NestJS backend
    src/modules/
      admin/              # Admin API
      auth/               # Autentykacja
      companies/          # Firmy + członkowie
      stops/              # Przystanki
      routes/             # Trasy
      vehicles/           # Pojazdy
      trips/              # Kursy
      simulator/          # Symulator GPS
      mailer/             # Wysyłka emaili
      realtime/           # WebSocket
  web/                    # Next.js frontend
    src/app/[locale]/     # Strony z i18n
      (admin)/admin/      # Panel admin
      (dashboard)/        # Panel użytkownika
      (auth)/             # Logowanie, rejestracja
    messages/             # Tłumaczenia (pl/, en/)
  mobile/                 # React Native app
packages/
  shared/                 # Wspólne typy, walidatory
docs/                     # Dokumentacja (ten plik)
```

---

## Komendy deweloperskie

```bash
# Uruchomienie
pnpm dev              # Wszystko (docker + api + web + mobile)
pnpm dev:api          # Tylko API
pnpm dev:web          # Tylko Web
pnpm dev:mobile       # Tylko Mobile

# Baza danych
pnpm studio           # Prisma Studio
pnpm db:migrate       # Migracje
pnpm db:seed          # Seed data

# Docker
make up               # Start containers
make down             # Stop containers
make logs             # View logs
```

---

## Notatki techniczne

### Autoryzacja endpointów
- Endpointy z `@Roles()` -> RolesGuard pobiera `dbUser` z bazy
- Endpointy bez `@Roles()` -> tylko JWT payload (`user.id`, `user.email`)
- `checkCompanyAccess()` w CompaniesController sam pobiera dane gdy `dbUser` nie jest ustawiony

### i18n routing
- Middleware w `apps/web/middleware.ts` obsługuje przekierowania
- Root `/` -> redirect do `/${defaultLocale}`
- Wszystkie strony w `[locale]/`
- Emaile zawierają pełny URL z locale

### Zarządzanie członkami firm
- Endpointy: `GET/POST/PUT/DELETE /companies/:id/members`
- Autoryzacja: admin, superadmin, lub owner firmy
- Walidacja: firma musi mieć min. 1 ownera
