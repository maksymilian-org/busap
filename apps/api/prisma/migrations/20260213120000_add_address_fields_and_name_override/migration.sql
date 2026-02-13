-- AlterTable
ALTER TABLE "stops" ADD COLUMN "county" TEXT;
ALTER TABLE "stops" ADD COLUMN "region" TEXT;
ALTER TABLE "stops" ADD COLUMN "postal_code" TEXT;
ALTER TABLE "stops" ADD COLUMN "country_code" TEXT;
ALTER TABLE "stops" ADD COLUMN "formatted_address" TEXT;

-- AlterTable
ALTER TABLE "routes" ADD COLUMN "name_overridden" BOOLEAN NOT NULL DEFAULT false;
