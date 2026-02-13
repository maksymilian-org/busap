-- AlterTable
ALTER TABLE "route_stops" ADD COLUMN "is_main" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "routes" ADD COLUMN "comment" TEXT;
