# Busap - Bus Transport Platform

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **API** (`apps/api`): NestJS 10, Prisma 6, PostgreSQL, Socket.io, JWT auth
- **Web** (`apps/web`): Next.js (App Router), Tailwind CSS, Radix UI, next-intl (i18n)
- **Mobile** (`apps/mobile`): React Native / Expo
- **Shared** (`packages/shared`): Types, validators (Zod), constants — used by API and web

## Key Commands

```bash
pnpm dev:api              # Start API (nest --watch, port 3001)
pnpm dev:web              # Start web (next dev, port 3000)
pnpm db:migrate           # Prisma migrate dev (from root)
pnpm db:seed              # Seed database
pnpm studio               # Prisma Studio
cd packages/shared && pnpm build   # Rebuild shared package after changes
cd apps/api && npx prisma generate # Regenerate Prisma client
```

**Important**: `prisma generate` will fail with EPERM if the API dev server is running (DLL lock). Stop it first.

## Project Structure

```
apps/api/
  prisma/schema.prisma          # Database schema (single file)
  prisma/migrations/            # SQL migrations (manual or generated)
  prisma/seed.ts                # Demo data seeder
  src/modules/                  # NestJS modules: auth, stops, routes, trips, vehicles,
                                # companies, users, admin, schedules, calendars, etc.
  src/common/decorators/        # @Public(), @Roles(), @CurrentUser()
  src/common/guards/            # AuthGuard (JWT), RolesGuard

apps/web/
  src/app/[locale]/(admin)/     # Admin panel pages
  src/app/[locale]/(dashboard)/ # User dashboard (passenger/driver/manager)
  src/app/[locale]/(company)/   # Company panel (owner/manager)
  src/app/[locale]/(auth)/      # Login/register
  src/contexts/auth-context.tsx # Auth state, login/logout, companyMemberships
  src/lib/api.ts                # API client with token management
  src/lib/fuzzy-search.ts       # Fuzzy search with Polish diacritics normalization
  src/components/ui/            # Radix-based UI components (button, card, toast)
  messages/pl/                  # Polish translations (JSON per namespace)
  messages/en/                  # English translations

packages/shared/
  src/types/                    # TypeScript interfaces (Stop, Route, User, etc.)
  src/validators/index.ts       # Zod schemas for all entities
  src/constants/index.ts        # Enums: UserRole, TripStatus, VehicleStatus, etc.
```

## Conventions

### API (NestJS)

- Controllers use `@CurrentUser() user: any` — user object has `user.dbUser` (full DB user with `companyUsers`) set by RolesGuard
- `@Roles(UserRole.MANAGER, UserRole.OWNER)` — checks company roles via RolesGuard
- `@Public()` — skips auth guard
- Services use `PrismaService` injected via constructor
- Transactions: `this.prisma.$transaction(async (tx: Prisma.TransactionClient) => { ... })`
- Soft deletes: set `isActive: false` instead of actual deletion

### Web (Next.js)

- Translations: `useTranslations('admin.companies')` — namespaces correspond to JSON files in `messages/{locale}/`
- Auth context: `useAuth()` returns `{ user, login, logout, refreshUser, isOwnerOf, isManagerOf }`
- **Login response does NOT include companyMemberships** — only `getMe()` does. After login, `auth-context` calls `getMe()` to get full user data.
- Client-side search: use `fuzzyFilter()` from `@/lib/fuzzy-search` (handles Polish diacritics: ą→a, ć→c, ę→e, ł→l, etc.)
- Icons: lucide-react
- Links: `import { Link } from '@/i18n/navigation'` (locale-aware)
- Routing: `import { usePathname, useRouter } from '@/i18n/navigation'`

### Shared Package

- After modifying types/validators/constants, run `cd packages/shared && pnpm build`
- Types are re-exported through `src/types/index.ts`
- Import in API/web: `import { UserRole, CreateStopInput } from '@busap/shared'`

### Database

- Prisma 6 (not 7) — schema uses `datasource.url = env("DATABASE_URL")`
- Column naming: `@map("snake_case")`, table naming: `@@map("plural_snake")`
- UUIDs for all IDs: `@id @default(uuid())`
- Relations use `onDelete: Cascade` for ownership, `SET NULL` for optional refs
- CompanyFavoriteStop/Route: `@@unique([companyId, stopId/routeId])` — compound unique for favorites

### Migrations

- Create migration folder: `apps/api/prisma/migrations/YYYYMMDDHHMMSS_description/migration.sql`
- Write raw SQL (Prisma convention: `-- AlterTable`, `-- CreateTable`, etc.)
- Or generate: `cd apps/api && npx prisma migrate dev --name description`

## User Roles

- **System roles** (`user.systemRole`): `passenger`, `admin`, `superadmin`
- **Company roles** (`companyUser.role`): `passenger`, `driver`, `manager`, `owner`
- Admin/superadmin access: checked via `systemRole` in RolesGuard
- Company access: checked via `companyUsers` relation in RolesGuard

## Communication

- Odpowiadaj po polsku, chyba że kontekst wymaga angielskiego (np. komentarze w kodzie, nazwy zmiennych)
- Kod i komentarze w kodzie zawsze po angielsku
- Tłumaczenia UI: zawsze dodawaj w obu językach (pl + en)
