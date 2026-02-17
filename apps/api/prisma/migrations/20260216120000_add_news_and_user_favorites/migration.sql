-- CreateTable
CREATE TABLE "company_news" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "image_url" TEXT,
    "published_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorite_companies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorite_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorite_routes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorite_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorite_stops" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stop_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorite_stops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_news_company_id_published_at_idx" ON "company_news"("company_id", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorite_companies_user_id_company_id_key" ON "user_favorite_companies"("user_id", "company_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorite_routes_user_id_route_id_key" ON "user_favorite_routes"("user_id", "route_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorite_stops_user_id_stop_id_key" ON "user_favorite_stops"("user_id", "stop_id");

-- AddForeignKey
ALTER TABLE "company_news" ADD CONSTRAINT "company_news_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_news" ADD CONSTRAINT "company_news_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_companies" ADD CONSTRAINT "user_favorite_companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_companies" ADD CONSTRAINT "user_favorite_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_routes" ADD CONSTRAINT "user_favorite_routes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_routes" ADD CONSTRAINT "user_favorite_routes_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_stops" ADD CONSTRAINT "user_favorite_stops_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_stops" ADD CONSTRAINT "user_favorite_stops_stop_id_fkey" FOREIGN KEY ("stop_id") REFERENCES "stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
