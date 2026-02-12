import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedCalendars } from './seeds/calendars.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create superadmin user
  const superadminEmail = process.env.SUPERADMIN_EMAIL || 'admin@busap.pl';
  const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'Admin123!';

  const existing = await prisma.user.findUnique({
    where: { email: superadminEmail },
  });

  if (!existing) {
    const passwordHash = await bcrypt.hash(superadminPassword, 12);

    const superadmin = await prisma.user.create({
      data: {
        email: superadminEmail,
        passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        systemRole: 'superadmin',
        preferredLanguage: 'pl',
      },
    });

    console.log(`Superadmin created: ${superadmin.email}`);
  } else {
    console.log(`Superadmin already exists: ${existing.email}`);
  }

  // Create a demo company
  const demoCompany = await prisma.company.upsert({
    where: { slug: 'demo-transport' },
    update: {},
    create: {
      name: 'Demo Transport',
      slug: 'demo-transport',
      contactEmail: 'demo@busap.pl',
      contactPhone: '+48 123 456 789',
      description: 'Firma demonstracyjna do testowania platformy Busap',
      address: 'ul. Testowa 1, 00-001 Warszawa',
    },
  });

  console.log(`Demo company: ${demoCompany.name}`);

  // Create demo stops (Polish cities)
  const stops = [
    { name: 'Warszawa Centralna', code: 'WAW', latitude: 52.2297, longitude: 21.0122, city: 'Warszawa', country: 'PL' },
    { name: 'Lodz Fabryczna', code: 'LDZ', latitude: 51.7769, longitude: 19.4547, city: 'Lodz', country: 'PL' },
    { name: 'Krakow Glowny', code: 'KRK', latitude: 50.0647, longitude: 19.9450, city: 'Krakow', country: 'PL' },
    { name: 'Wroclaw Glowny', code: 'WRO', latitude: 51.0990, longitude: 17.0358, city: 'Wroclaw', country: 'PL' },
    { name: 'Poznan Glowny', code: 'POZ', latitude: 52.4064, longitude: 16.9252, city: 'Poznan', country: 'PL' },
    { name: 'Gdansk Glowny', code: 'GDA', latitude: 54.3520, longitude: 18.6466, city: 'Gdansk', country: 'PL' },
    { name: 'Katowice', code: 'KTW', latitude: 50.2649, longitude: 19.0238, city: 'Katowice', country: 'PL' },
    { name: 'Radom', code: 'RDM', latitude: 51.4027, longitude: 21.1471, city: 'Radom', country: 'PL' },
  ];

  for (const stop of stops) {
    await prisma.stop.upsert({
      where: { id: stop.code }, // will fail on first run, that's fine
      update: {},
      create: {
        ...stop,
        companyId: demoCompany.id,
      },
    });
  }

  // Use findMany to get actual stop records
  const createdStops = await prisma.stop.findMany({
    where: { companyId: demoCompany.id },
    orderBy: { name: 'asc' },
  });

  console.log(`Demo stops created: ${createdStops.length}`);

  // Create a demo route: Warszawa -> Krakow
  const wawStop = createdStops.find((s) => s.code === 'WAW');
  const rdmStop = createdStops.find((s) => s.code === 'RDM');
  const ktwStop = createdStops.find((s) => s.code === 'KTW');
  const krkStop = createdStops.find((s) => s.code === 'KRK');

  if (wawStop && rdmStop && ktwStop && krkStop) {
    const existingRoute = await prisma.route.findFirst({
      where: { companyId: demoCompany.id, code: 'WAW-KRK' },
    });

    if (!existingRoute) {
      const route = await prisma.route.create({
        data: {
          companyId: demoCompany.id,
          name: 'Warszawa - Krakow',
          code: 'WAW-KRK',
          description: 'Trasa Warszawa - Radom - Katowice - Krakow',
          type: 'linear',
        },
      });

      const routeVersion = await prisma.routeVersion.create({
        data: {
          routeId: route.id,
          versionNumber: 1,
          validFrom: new Date(),
          isActive: true,
          stops: {
            create: [
              { stopId: wawStop.id, sequenceNumber: 0, distanceFromStart: 0, durationFromStart: 0 },
              { stopId: rdmStop.id, sequenceNumber: 1, distanceFromStart: 100000, durationFromStart: 75 },
              { stopId: ktwStop.id, sequenceNumber: 2, distanceFromStart: 270000, durationFromStart: 195 },
              { stopId: krkStop.id, sequenceNumber: 3, distanceFromStart: 340000, durationFromStart: 240 },
            ],
          },
        },
      });

      await prisma.route.update({
        where: { id: route.id },
        data: { currentVersionId: routeVersion.id },
      });

      console.log(`Demo route created: ${route.name}`);

      // Create a demo vehicle
      const vehicle = await prisma.vehicle.create({
        data: {
          companyId: demoCompany.id,
          registrationNumber: 'WA 12345',
          brand: 'Mercedes-Benz',
          model: 'Tourismo',
          capacity: 50,
          status: 'active',
        },
      });

      console.log(`Demo vehicle created: ${vehicle.registrationNumber}`);
    }
  }

  // Seed calendars (Polish holidays and school calendars)
  await seedCalendars();

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
