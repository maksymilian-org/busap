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
# Start PostgreSQL, Redis, and Appwrite
docker-compose up -d

# Check status
docker ps
```

This starts:
- **PostgreSQL** (port 5432) - main database
- **Redis** (port 6379) - caching
- **Appwrite** (port 80) - authentication service with MariaDB, Redis, InfluxDB

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Appwrite

The project uses [Appwrite](https://appwrite.io/) for user authentication. Appwrite is included in docker-compose and starts automatically with the infrastructure.

#### First-time Setup

1. Open the Appwrite console at http://localhost
2. Create an admin account (first user becomes the root admin)
3. Create a new project:
   - Click **Create Project**
   - Name: `busap`
   - Project ID: `busap` (or copy the generated ID)
4. Generate an API key:
   - Go to **Settings > API Keys**
   - Click **Create API Key**
   - Name: `busap-api`
   - Select scopes: `users.read`, `users.write`
   - Copy the generated key

#### Configure Environment Variables

Update the `.env` file with your Appwrite API key:

```bash
APPWRITE_ENDPOINT=http://localhost/v1
APPWRITE_PROJECT_ID=busap
APPWRITE_API_KEY=your_generated_api_key
```

### 4. Set Up Environment

Copy the `.env` file to the app folders:

```bash
cp .env apps/api/.env
```

### 5. Prepare the Database

```bash
cd apps/api
npx prisma generate
npx prisma db push
```

### 6. Run the Applications

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

**Note:** The accounts are created in the local database. Full authentication requires Appwrite configuration.

## API Documentation

After starting the API, Swagger docs are available at:
- http://localhost:3001/docs

## Main API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | User registration |
| `/api/v1/auth/sync` | POST | Sync with Appwrite |
| `/api/v1/companies` | GET/POST | List/create companies |
| `/api/v1/routes` | GET/POST | List/create routes |
| `/api/v1/trips` | GET/POST | List/create trips |
| `/api/v1/stops` | GET/POST | List/create stops |
| `/api/v1/vehicles` | GET/POST | List/create vehicles |
| `/api/v1/pricing` | GET/POST | Pricing |
| `/api/v1/eta` | GET | Estimated time of arrival |
| `/api/v1/gps/report` | POST | Report GPS position |

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
- **Authentication:** Appwrite
- **API Documentation:** Swagger/OpenAPI

## Environment Variables

| Variable | Description | Default Value |
|----------|-------------|--------------|
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://busap:busap_secret@localhost:5432/busap` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `API_PORT` | API Port | `3001` |
| `APPWRITE_ENDPOINT` | Appwrite endpoint | `http://localhost/v1` |
| `APPWRITE_PROJECT_ID` | Appwrite project ID | `busap` |
| `APPWRITE_API_KEY` | Appwrite API key | - |

## License

Private project.
