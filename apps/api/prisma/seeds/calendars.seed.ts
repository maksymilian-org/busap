import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Polish public holidays
const PL_HOLIDAYS = [
  { name: 'Nowy Rok', dateType: 'fixed', fixedDate: '01-01' },
  { name: 'Trzech Kroli', dateType: 'fixed', fixedDate: '01-06' },
  { name: 'Wielkanoc', dateType: 'easter_relative', easterOffset: 0 },
  { name: 'Poniedzialek Wielkanocny', dateType: 'easter_relative', easterOffset: 1 },
  { name: 'Swieto Pracy', dateType: 'fixed', fixedDate: '05-01' },
  { name: 'Swieto Konstytucji 3 Maja', dateType: 'fixed', fixedDate: '05-03' },
  { name: 'Zielone Swiatki', dateType: 'easter_relative', easterOffset: 49 },
  { name: 'Boze Cialo', dateType: 'easter_relative', easterOffset: 60 },
  { name: 'Wniebowziecie NMP', dateType: 'fixed', fixedDate: '08-15' },
  { name: 'Wszystkich Swietych', dateType: 'fixed', fixedDate: '11-01' },
  { name: 'Swieto Niepodleglosci', dateType: 'fixed', fixedDate: '11-11' },
  { name: 'Boze Narodzenie (1)', dateType: 'fixed', fixedDate: '12-25' },
  { name: 'Boze Narodzenie (2)', dateType: 'fixed', fixedDate: '12-26' },
];

// Polish voivodeships with their 2026 winter break dates
// Based on typical MEN (Ministry of Education) schedules
const POLISH_VOIVODESHIPS_2026 = [
  { code: 'dolnoslaskie', name: 'Dolnoslaskie', startDate: '2026-01-12', endDate: '2026-01-25' },
  { code: 'kujawsko-pomorskie', name: 'Kujawsko-Pomorskie', startDate: '2026-02-16', endDate: '2026-03-01' },
  { code: 'lubelskie', name: 'Lubelskie', startDate: '2026-01-26', endDate: '2026-02-08' },
  { code: 'lubuskie', name: 'Lubuskie', startDate: '2026-01-12', endDate: '2026-01-25' },
  { code: 'lodzkie', name: 'Lodzkie', startDate: '2026-02-02', endDate: '2026-02-15' },
  { code: 'malopolskie', name: 'Malopolskie', startDate: '2026-02-02', endDate: '2026-02-15' },
  { code: 'mazowieckie', name: 'Mazowieckie', startDate: '2026-01-26', endDate: '2026-02-08' },
  { code: 'opolskie', name: 'Opolskie', startDate: '2026-02-16', endDate: '2026-03-01' },
  { code: 'podkarpackie', name: 'Podkarpackie', startDate: '2026-01-12', endDate: '2026-01-25' },
  { code: 'podlaskie', name: 'Podlaskie', startDate: '2026-01-26', endDate: '2026-02-08' },
  { code: 'pomorskie', name: 'Pomorskie', startDate: '2026-01-12', endDate: '2026-01-25' },
  { code: 'slaskie', name: 'Slaskie', startDate: '2026-02-02', endDate: '2026-02-15' },
  { code: 'swietokrzyskie', name: 'Swietokrzyskie', startDate: '2026-02-02', endDate: '2026-02-15' },
  { code: 'warminsko-mazurskie', name: 'Warminsko-Mazurskie', startDate: '2026-01-26', endDate: '2026-02-08' },
  { code: 'wielkopolskie', name: 'Wielkopolskie', startDate: '2026-01-12', endDate: '2026-01-25' },
  { code: 'zachodniopomorskie', name: 'Zachodniopomorskie', startDate: '2026-02-16', endDate: '2026-03-01' },
];

// Summer break is typically July and August
const SUMMER_BREAK_2026 = {
  startDate: '2026-06-27', // Last Saturday of June
  endDate: '2026-08-31',
};

export async function seedCalendars() {
  console.log('Seeding calendars...');

  // Create Polish public holidays calendar
  const holidaysCalendar = await prisma.calendar.upsert({
    where: { code: 'pl-holidays' },
    update: {
      name: 'Polskie swieta panstwowe',
      description: 'Dni ustawowo wolne od pracy w Polsce',
    },
    create: {
      code: 'pl-holidays',
      name: 'Polskie swieta panstwowe',
      description: 'Dni ustawowo wolne od pracy w Polsce',
      country: 'PL',
      type: 'holidays',
      isActive: true,
    },
  });

  console.log(`Created calendar: ${holidaysCalendar.name}`);

  // Add holiday entries
  for (const holiday of PL_HOLIDAYS) {
    const existingEntry = await prisma.calendarEntry.findFirst({
      where: {
        calendarId: holidaysCalendar.id,
        name: holiday.name,
      },
    });

    if (!existingEntry) {
      await prisma.calendarEntry.create({
        data: {
          calendarId: holidaysCalendar.id,
          name: holiday.name,
          dateType: holiday.dateType,
          fixedDate: holiday.fixedDate || null,
          easterOffset: holiday.easterOffset ?? null,
          isRecurring: true,
        },
      });
      console.log(`  Added: ${holiday.name}`);
    }
  }

  // Create school calendars for each voivodeship (2026)
  for (const voivodeship of POLISH_VOIVODESHIPS_2026) {
    const calendarCode = `school-${voivodeship.code}-2026`;

    const schoolCalendar = await prisma.calendar.upsert({
      where: { code: calendarCode },
      update: {
        name: `Kalendarz szkolny - ${voivodeship.name} 2025/2026`,
      },
      create: {
        code: calendarCode,
        name: `Kalendarz szkolny - ${voivodeship.name} 2025/2026`,
        description: `Dni wolne od nauki w wojewodztwie ${voivodeship.name.toLowerCase()} (rok szkolny 2025/2026)`,
        country: 'PL',
        region: voivodeship.code,
        type: 'school_days',
        year: 2026,
        isActive: true,
      },
    });

    // Add winter break entry
    const winterBreakEntry = await prisma.calendarEntry.findFirst({
      where: {
        calendarId: schoolCalendar.id,
        name: 'Ferie zimowe',
      },
    });

    if (!winterBreakEntry) {
      await prisma.calendarEntry.create({
        data: {
          calendarId: schoolCalendar.id,
          name: 'Ferie zimowe',
          dateType: 'fixed',
          startDate: voivodeship.startDate,
          endDate: voivodeship.endDate,
          isRecurring: false,
        },
      });
    }

    // Add summer break entry
    const summerBreakEntry = await prisma.calendarEntry.findFirst({
      where: {
        calendarId: schoolCalendar.id,
        name: 'Wakacje letnie',
      },
    });

    if (!summerBreakEntry) {
      await prisma.calendarEntry.create({
        data: {
          calendarId: schoolCalendar.id,
          name: 'Wakacje letnie',
          dateType: 'fixed',
          startDate: SUMMER_BREAK_2026.startDate,
          endDate: SUMMER_BREAK_2026.endDate,
          isRecurring: false,
        },
      });
    }

    console.log(`Created school calendar: ${schoolCalendar.name}`);
  }

  // Create a generic Polish weekdays (working days) calendar
  const workdaysCalendar = await prisma.calendar.upsert({
    where: { code: 'pl-workdays' },
    update: {},
    create: {
      code: 'pl-workdays',
      name: 'Polskie dni robocze',
      description: 'Kalendarz pomocniczy - poniedzialek-piatek bez swiat',
      country: 'PL',
      type: 'custom',
      isActive: true,
    },
  });

  console.log(`Created calendar: ${workdaysCalendar.name}`);

  console.log('Calendar seeding complete!');
}

// Run directly if called as main
if (require.main === module) {
  seedCalendars()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
