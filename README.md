# Busap - Intercity Bus Transport Platform

A monorepo containing the mobile app, web app, and API for the intercity bus transport platform.

## Project Structure

```
busap/
├── apps/
│   ├── api/        # Backend: NestJS + Prisma + PostgreSQL
│   ├── mobile/     # Mobile app: React Native + Expo
│   └── web/        # Web app: Next.js
├── packages/
│   └── shared/     # Shared types and constants
└── docker-compose.yml
```

## Requirements

- Node.js 20+
- pnpm 9+
- Docker and Docker Compose
- Android Studio (for Android mobile app)
- Xcode (for iOS mobile app, macOS only)

## Quick Start

### 1. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Check status
docker ps
```

This starts:
- **PostgreSQL** (port 5432) - main database
- **Redis** (port 6379) - caching and realtime pub/sub
- **OpenRouteService** (port 8082) - local routing engine (see [Route Geometry / ORS](#route-geometry--openrouteservice))

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment

Copy the `.env.example` file:

```bash
cp .env.example .env
cp .env apps/api/.env
```

Update `JWT_SECRET` in the `.env` file with a secure random string.

### 4. Prepare the Database

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev
```

### 5. Run the Applications

#### API (port 3001)
```bash
pnpm --filter @busap/api dev
```

#### Mobile App
```bash
# Android
pnpm --filter @busap/mobile android

# iOS (macOS only)
pnpm --filter @busap/mobile ios
```

#### Web App (port 3000)
```bash
pnpm --filter @busap/web dev
```

## Test Accounts

| Email | Role | Permissions |
|-------|------|-------------|
| maksymilian.org@gmail.com | superadmin | Full access to everything |
| maksymilian.org+owner@gmail.com | owner | Manage company |
| maksymilian.org+manager@gmail.com | manager | Manage routes and trips |
| maksymilian.org+driver@gmail.com | driver | Operate assigned trips |
| maksymilian.org+passenger@gmail.com | passenger | Search and purchase tickets |

**Note:** Register accounts via `POST /api/v1/auth/register` with email and password.

## API Documentation

After starting the API, Swagger docs are available at:
- http://localhost:3001/docs

## Main API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | User registration |
| `/api/v1/auth/login` | POST | Login with email/password |
| `/api/v1/auth/refresh` | POST | Refresh access token |
| `/api/v1/auth/logout` | POST | Logout and revoke tokens |
| `/api/v1/auth/me` | GET | Get current user profile |
| `/api/v1/companies` | GET/POST | List/create companies |
| `/api/v1/routes` | GET/POST | List/create routes |
| `/api/v1/trips` | GET/POST | List/create trips |
| `/api/v1/stops` | GET/POST | List/create stops |
| `/api/v1/vehicles` | GET/POST | List/create vehicles |
| `/api/v1/pricing` | GET/POST | Pricing |
| `/api/v1/eta` | GET | Estimated time of arrival |
| `/api/v1/gps/report` | POST | Report GPS position |
| `/api/v1/storage/upload/*` | POST | Upload files |

## WebSocket (Realtime)

Connect to `/realtime` namespace with Socket.io. Pass JWT token in `auth.token` handshake parameter.

Events:
- `subscribe:trip` / `unsubscribe:trip` — subscribe to trip GPS updates
- `subscribe:route` / `unsubscribe:route` — subscribe to route GPS updates
- `position:update` — receive live bus position updates

## Role System

### Permission Hierarchy

1. **superadmin** - Full access to all resources
2. **owner** - Manage own company, users, vehicles
3. **manager** - Create routes, trips, manage operations
4. **driver** - Operate assigned trips, report GPS
5. **passenger** - Search routes, purchase tickets (public access)

## Route Geometry / OpenRouteService

Routes use [OpenRouteService](https://openrouteservice.org) (ORS) to generate road-based geometry instead of straight lines between stops. ORS can run locally via Docker or use the public API.

### Option A: Local ORS (recommended for production)

1. Download OSM data for your region (e.g. Poland):

```bash
mkdir -p docker/ors/files
curl -L -o docker/ors/files/poland-latest.osm.pbf \
  https://download.geofabrik.de/europe/poland-latest.osm.pbf
```

2. Start ORS with docker-compose (included in `docker-compose up -d`). First startup builds routing graphs — takes ~5–15 min for Poland.

3. Set env vars in `apps/api/.env`:

```
ORS_BASE_URL=http://localhost:8082/ors
ORS_FALLBACK_URL=https://api.openrouteservice.org
ORS_API_KEY=<your-public-api-key>
ORS_PROFILE=driving-hgv
```

Local ORS does not require an API key. The fallback URL + key are used if local ORS is unreachable.

4. Verify:

```bash
curl http://localhost:8082/ors/v2/health
```

### Option B: Public API only

1. Get a free API key at [openrouteservice.org/dev/#/signup](https://openrouteservice.org/dev/#/signup) (2000 req/day).

2. Set env vars in `apps/api/.env`:

```
ORS_BASE_URL=https://api.openrouteservice.org
ORS_FALLBACK_URL=
ORS_API_KEY=<your-api-key>
ORS_PROFILE=driving-hgv
```

### Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ORS_BASE_URL` | Primary ORS endpoint | `https://api.openrouteservice.org` |
| `ORS_FALLBACK_URL` | Fallback ORS endpoint (used when primary fails) | _(empty)_ |
| `ORS_API_KEY` | API key (required for public API, not needed for local) | _(empty)_ |
| `ORS_PROFILE` | Routing profile (`driving-hgv`, `driving-car`, etc.) | `driving-hgv` |

### How it works

- When creating/editing a route in the Route Builder, the frontend calls `POST /routes/preview-geometry` to get road-based geometry in real-time.
- Users can drag the route line on the map to add waypoints and adjust the path.
- On save, geometry, distances, and durations are stored with the route version.
- If ORS is unavailable, routes are saved without geometry and displayed as straight lines (fallback).

## Development

### Adding Database Migrations

```bash
cd apps/api
npx prisma migrate dev --name migration_name
```

### Launch Prisma Studio

```bash
cd apps/api
npx prisma studio
```

### Typechecking

```bash
# All packages
pnpm typecheck

# Specific app
pnpm --filter @busap/api typecheck
pnpm --filter @busap/mobile typecheck
pnpm --filter @busap/web typecheck
```

### Linting

```bash
pnpm lint
```

## Technologies

- **API:** NestJS, Prisma, PostgreSQL, Redis, Fastify
- **Mobile:** React Native, Expo SDK 54, expo-router
- **Web:** Next.js 15, React 19, TailwindCSS
- **Shared:** TypeScript, Zod
- **Authentication:** bcrypt + JWT (access + refresh tokens)
- **Realtime:** Socket.io + Redis pub/sub
- **Storage:** Local filesystem (S3-ready abstract interface)
- **API Documentation:** Swagger/OpenAPI

## Environment Variables

| Variable | Description | Default Value |
|----------|-------------|--------------|
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://busap:busap_secret@localhost:5432/busap` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `API_PORT` | API Port | `3001` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `UPLOAD_DIR` | File upload directory | `./uploads` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `5242880` |
| `ORS_BASE_URL` | Primary ORS endpoint | `https://api.openrouteservice.org` |
| `ORS_FALLBACK_URL` | Fallback ORS endpoint | - |
| `ORS_API_KEY` | ORS API key (for public API) | - |
| `ORS_PROFILE` | ORS routing profile | `driving-hgv` |

## License

Private project.
