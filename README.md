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

## License

Private project.
