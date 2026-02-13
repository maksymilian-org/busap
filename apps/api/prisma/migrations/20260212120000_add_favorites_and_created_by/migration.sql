-- AlterTable
ALTER TABLE "stops" ADD COLUMN "created_by_id" TEXT;

-- AlterTable
ALTER TABLE "routes" ADD COLUMN "created_by_id" TEXT;

-- CreateTable
CREATE TABLE "company_favorite_stops" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "stop_id" TEXT NOT NULL,
    "added_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_favorite_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_favorite_routes" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "added_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_favorite_routes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_favorite_stops_company_id_stop_id_key" ON "company_favorite_stops"("company_id", "stop_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_favorite_routes_company_id_route_id_key" ON "company_favorite_routes"("company_id", "route_id");

-- AddForeignKey
ALTER TABLE "stops" ADD CONSTRAINT "stops_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_favorite_stops" ADD CONSTRAINT "company_favorite_stops_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_favorite_stops" ADD CONSTRAINT "company_favorite_stops_stop_id_fkey" FOREIGN KEY ("stop_id") REFERENCES "stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_favorite_stops" ADD CONSTRAINT "company_favorite_stops_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_favorite_routes" ADD CONSTRAINT "company_favorite_routes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_favorite_routes" ADD CONSTRAINT "company_favorite_routes_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_favorite_routes" ADD CONSTRAINT "company_favorite_routes_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
