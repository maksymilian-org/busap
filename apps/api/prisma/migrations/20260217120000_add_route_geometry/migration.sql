-- AlterTable
ALTER TABLE "route_versions"
  ADD COLUMN "geometry" JSONB,
  ADD COLUMN "total_distance" DOUBLE PRECISION,
  ADD COLUMN "total_duration" INTEGER,
  ADD COLUMN "waypoints" JSONB NOT NULL DEFAULT '{}';
