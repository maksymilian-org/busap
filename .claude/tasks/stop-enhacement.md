# TASK: Enhanced Stop & Route Management

## Context
Project: Busap (intercity bus platform)
Stack: NestJS + Prisma + PostgreSQL, React Native, Next.js
Repo: https://github.com/maksymilian-org/busap

## Requirements

### 1. Stop Address Enhancement
**Current**: Stops have: name, city, lat/lon
**Goal**: Add international address structure:
- Required: city, country, countryCode (ISO 3166-1 alpha-2), lat/lon
- Optional: county/district, region/state, postalCode, formattedAddress
- Auto-populate via Nominatim reverse geocoding on map click
- Allow manual override (users can edit auto-filled fields)

### 2. Route Auto-Naming
**Current**: Route names manually entered or generic
**Goal**: Auto-generate from city names (NOT stop names)
- Format: "Lublin - Warsaw" or "Lublin - Warsaw (via Puławy, Dęblin)"
- Regenerate when stops change (unless manually overridden)
- Only admin/superadmin can manually edit names (enforce via permissions)
- Add `nameOverridden` boolean flag to track manual edits

## Implementation Steps

1. **Schema**: Update Stop model with address fields, Route with nameOverridden
2. **Geocoding**: Create service using Nominatim (https://nominatim.openstreetmap.org/reverse)
   - Rate limit: 1 req/sec
   - Consider Redis caching (round coords to 4 decimals)
3. **Stop Service**: Auto-geocode on create/update if coords provided
4. **Route Service**: 
   - Auto-generate name from stop cities
   - Protect manual edits (throw 403 if non-admin tries to edit name)
   - Regenerate on stop changes (unless nameOverridden=true)
5. **Frontend**: Map click → auto-fill address inputs
6. **Migration**: Backfill existing data

## Key Constraints
- Use existing project patterns (check current services/DTOs)
- Follow NestJS best practices already in codebase
- Maintain backward compatibility
- Handle geocoding failures gracefully

## Success Criteria
- ✅ Map click populates city, county, region, postal code
- ✅ Routes auto-named: "CityA - CityB (via CityC)"
- ✅ Non-admins get 403 when trying to edit route name
- ✅ Name regenerates on stop change (unless overridden)

Start by examining existing Prisma schema and service patterns.

## Related Files
- Schema: apps/api/prisma/schema.prisma
- Stop Service: apps/api/src/modules/stops/
- Route Service: apps/api/src/modules/routes/

## Dependencies
- @nestjs/common
- nominatim API (no package needed)

## Testing
- Run: pnpm --filter @busap/api test stops
- Manual: Create stop via POST /api/v1/stops