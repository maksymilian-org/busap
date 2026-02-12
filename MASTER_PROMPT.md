# MASTER PROMPT – Busap (Updated)

## Table of Contents
1. [Project](#project)
2. [Goal](#goal)
3. [Brand](#brand)
4. [Technology Stack](#technology-stack)
5. [User Roles](#user-roles)
6. [Features](#features)
   - [Core MVP](#core-mvp)
   - [Advanced / Future](#advanced--future)
7. [Architecture](#architecture)
8. [DevOps & Local Development](#devops--local-development)
9. [AI Objectives](#ai-objectives)
10. [Notes](#notes)
11. [Final Deliverables](#final-deliverables)

---

## Project
**Busap** – Intercity Bus Transportation Platform

---

## Goal
Build a production-ready, scalable, modular monorepo application for intercity bus transportation.  
The platform serves passengers, drivers, managers, company owners, and a superadmin.  
The MVP should work locally and for pilot testing, designed for future scalability, SaaS monetization, offline support, real-time GPS, and multi-language support.

---

## Brand
- Temporary name: **Busap**
- Neutral and globally understandable

---

## Technology Stack
- **Mobile app:** Expo (React Native) + NativeWind
- **Web app:** Next.js (App Router) + Tailwind CSS
- **Backend:** Node.js (Fastify or NestJS) in **TypeScript**
- **Database:** PostgreSQL
- **Cache / Realtime:** Redis (ETA / GPS caching)
- **Auth:** bcrypt + JWT, **Realtime:** Socket.io + Redis pub/sub, **Storage:** Local filesystem (S3-ready)
- **Containerization:** Docker + Docker Compose
- **Repository:** GitHub
- **CLI-first workflow:** Makefile or custom CLI commands
- **Shared types:** `packages/shared` between frontend and backend
- **TypeScript:** mandatory across all code (frontend, backend, mobile, shared)
- **Library & container versions:** Use the **latest stable and supported versions** of all libraries, plugins, and Docker images

---

## User Roles
1. **Passenger**
   - Search bus trips
   - View ETA (schedule or GPS-based)
   - View bus location on map (OSM/Leaflet)
   - View price, company, vehicle photo
   - Offline fallback to schedule
2. **Driver**
   - Auto-assigned daily trips
   - Countdown to departure
   - GPS reporting with real-time updates
   - Alerts for deviations from schedule
   - Offline queue when network is unavailable
3. **Manager**
   - CRUD: stops, routes (linear & loop), trips, vehicles
   - Configure prices (flat, per segment)
   - Reports: punctuality, driver performance
4. **Owner**
   - Same as manager + assign roles
   - View manager reports
   - Approve company-wide changes
5. **Superadmin**
   - Full system access

---

## Features

### Core MVP
- Multi-company support
- Global routes & stops with company-specific overrides
- Versioned routes & schedules
- Temporary & permanent route exceptions (e.g., construction)
- ETA engine:
    - Schedule-based
    - GPS-adjusted
    - Historical correction
    - Traffic API-ready (future)
- Offline-first support
- Role-based access and audit logs
- Pricing engine: flat & segment-based
- Realtime GPS updates via Socket.io WebSocket
- Notifications for deviations from schedule
- Multilingual: PL, EN, UA, DE, IT, FR, ES, BE
- Map integration: OpenStreetMap + Leaflet
- Backend-only business logic
- **Public-facing website UI**:
    - Attractive landing page with graphics, sample content, pricing, and feature descriptions
    - Marketing content to encourage downloads and registrations
- **Private user dashboard UI**:
    - Fully functional panel after login
    - Access to all required user features (passenger, driver, manager, owner)

### Advanced / Future
- Ticketing with QR codes
- SaaS subscription per vehicle / vehicle pack
- Dynamic pricing
- Traffic-aware ETA
- Multi-region support
- Client API adapters

---

## Architecture
- Monorepo: `apps/mobile`, `apps/web`, `apps/api`, `packages/shared`
- Modular monolith backend: domain / application / infrastructure
- Docker-based dev & prod environment
- CLI commands: up, migrate, logs, deploy, test
- Shared TypeScript types between frontend and backend
- Fast, deterministic API endpoints
- Scalable: Redis cache, PostgreSQL, optional microservice extraction

---

## DevOps & Local Development
- Fully Dockerized
- One command to run the full system locally
- Environment variable management
- CI-ready structure
- GitHub integration
- Backend fully managed via CLI commands and AI assistance
- **Always use latest stable and supported versions** of all containers and services

---

## AI Objectives
1. Bootstrap monorepo structure with apps & packages
2. Generate frontend (Expo & Next.js) and backend boilerplate
3. Generate PostgreSQL schema with versioned routes/stops
4. Generate ETA engine module (schedule/GPS logic)
5. Generate backend APIs for all roles & features
6. Generate Docker / Docker Compose setup
7. Generate Makefile / CLI commands
8. Generate shared TypeScript types & validation
9. Generate i18n scaffolding for supported languages
10. Ensure offline-first handling & Realtime updates
11. Maximize performance for GPS / ETA
12. Generate audit logging & pricing logic
13. Build **attractive, rich UI for public website** with graphics, pricing, and features
14. Build **private dashboard** UI for all users
15. Prepare system for future scaling (traffic API, SaaS billing, multi-region)

---

## Notes
- All business logic must reside in backend (Node.js) only
- Auth: bcrypt + JWT. Realtime: Socket.io over Redis pub/sub. Storage: local filesystem with abstract provider interface.
- NativeWind for mobile, Tailwind for web
- ETA engine modular and cacheable (Redis)
- Offline support for drivers and passengers
- Track deviations from schedule and generate alerts for managers/owners
- Routes, stops, and trips must support versioning and per-company overrides
- Pricing flexible (flat / segment), extendable for km/time later
- Map integration: OpenStreetMap + Leaflet + real-time bus positions
- CLI-first development and AI-assisted backend management
- **Always use the latest stable, supported libraries, plugins, and containers**
- UI design: Public landing page and private dashboard with rich content

---

## Final Deliverables
- Complete monorepo runnable locally via Docker
- Fully typed TypeScript code
- All backend, frontend, and mobile modules scaffolded
- Attractive public website and functional private dashboard
- Ready for iterative development entirely via AI
