-- AlterTable: Make vehicleId and driverId nullable on trips
ALTER TABLE "trips" ALTER COLUMN "vehicle_id" DROP NOT NULL;
ALTER TABLE "trips" ALTER COLUMN "driver_id" DROP NOT NULL;

-- AlterTable: Add schedule_date to trips
ALTER TABLE "trips" ADD COLUMN "schedule_date" DATE;

-- CreateIndex: Unique constraint on (schedule_id, schedule_date) for trips
CREATE UNIQUE INDEX "trips_schedule_id_schedule_date_key" ON "trips"("schedule_id", "schedule_date");

-- AlterTable: Add company_id to calendars
ALTER TABLE "calendars" ADD COLUMN "company_id" TEXT;

-- CreateIndex: Index on company_id for calendars
CREATE INDEX "calendars_company_id_idx" ON "calendars"("company_id");

-- AddForeignKey: Calendar -> Company
ALTER TABLE "calendars" ADD CONSTRAINT "calendars_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: schedule_stop_times
CREATE TABLE "schedule_stop_times" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "route_stop_id" TEXT NOT NULL,
    "arrival_time" TEXT NOT NULL,
    "departure_time" TEXT NOT NULL,

    CONSTRAINT "schedule_stop_times_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint on (schedule_id, route_stop_id) for schedule_stop_times
CREATE UNIQUE INDEX "schedule_stop_times_schedule_id_route_stop_id_key" ON "schedule_stop_times"("schedule_id", "route_stop_id");

-- AddForeignKey: ScheduleStopTime -> TripSchedule
ALTER TABLE "schedule_stop_times" ADD CONSTRAINT "schedule_stop_times_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "trip_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ScheduleStopTime -> RouteStop
ALTER TABLE "schedule_stop_times" ADD CONSTRAINT "schedule_stop_times_route_stop_id_fkey" FOREIGN KEY ("route_stop_id") REFERENCES "route_stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
