import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const eventsSeed = [
  {
    name: "Mistrzostwa Polski Wyścigów Samochodowych",
    description:
      "Główna runda Mistrzostw Polski Wyścigów Samochodowych. Sprinty kwalifikacyjne i wyścig główny na torze Poznań.",
    category: "MPWS",
    date: new Date("2026-08-15"),
    time: "15:00",
    track: "Tor Poznań",
    city: "Poznań",
    voivodeship: "Wielkopolskie",
    imageUrl:
      "https://images.unsplash.com/photo-1638909469623-4fdd7758414b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    lat: 52.3312,
    lng: 16.8491,
    status: "APPROVED" as const,
  },
  {
    name: "Puchar Polski GT Racing",
    description: "Puchar Polski dla samochodów GT. Dwie sesje kwalifikacyjne oraz wyścig 45 minut.",
    category: "GT Racing",
    date: new Date("2026-08-29"),
    time: "14:00",
    track: "Autodrom Pomorze Pszczółki",
    city: "Pszczółki",
    voivodeship: "Pomorskie",
    imageUrl:
      "https://images.unsplash.com/photo-1617130644016-d318045a3958?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    lat: 54.1985,
    lng: 18.5986,
    status: "APPROVED" as const,
  },
  {
    name: "Drift Masters Polish Grand Prix",
    description: "Polska runda Drift Masters. Battle 1v1 i freestyle show po finale.",
    category: "Drift",
    date: new Date("2026-09-12"),
    time: "16:00",
    track: "Tor Słomczyn",
    city: "Słomczyn",
    voivodeship: "Mazowieckie",
    imageUrl:
      "https://images.unsplash.com/photo-1638909486348-82ae8d57dfd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    lat: 52.0376,
    lng: 20.7589,
    status: "APPROVED" as const,
  },
  {
    name: "Poland Racing Festival",
    description: "Festiwal wyścigowy z klasami touring, historic i open.",
    category: "Racing",
    date: new Date("2026-09-26"),
    time: "13:00",
    track: "Autodrom Most",
    city: "Most",
    voivodeship: "Dolnośląskie",
    imageUrl:
      "https://images.unsplash.com/photo-1752449096739-83ac1ef2c0dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    lat: 50.5031,
    lng: 13.636,
    status: "APPROVED" as const,
  },
  {
    name: "Śląski Wyścig Długodystansowy",
    description: "4-godzinny endurance z wymianami kierowców.",
    category: "Endurance",
    date: new Date("2026-10-10"),
    time: "12:00",
    track: "Tor Kamień Śląski",
    city: "Kamień Śląski",
    voivodeship: "Opolskie",
    imageUrl:
      "https://images.unsplash.com/photo-1664911200744-8c3a496baa2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    lat: 50.575,
    lng: 18.083,
    status: "APPROVED" as const,
  },
  {
    name: "Mazowieckie Mistrzostwa Trackday",
    description: "Track day z sesjami open pitlane oraz opcjonalnymi pomiarami czasu.",
    category: "Track Day",
    date: new Date("2026-10-24"),
    time: "10:00",
    track: "Tor Ułęż",
    city: "Ułęż",
    voivodeship: "Lubelskie",
    imageUrl:
      "https://images.unsplash.com/photo-1617130627248-0bf361f6556a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    lat: 51.627,
    lng: 22.108,
    status: "APPROVED" as const,
  },
  {
    name: "Nocny Drift Cup (oczekuje)",
    description: "Nocna runda driftowa — wniosek organizatora oczekuje na akceptację admina.",
    category: "Drift",
    date: new Date("2026-11-07"),
    time: "20:00",
    track: "Tor Słomczyn",
    city: "Słomczyn",
    voivodeship: "Mazowieckie",
    imageUrl:
      "https://images.unsplash.com/photo-1638909486348-82ae8d57dfd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    lat: 52.0376,
    lng: 20.7589,
    status: "PENDING" as const,
  },
  {
    name: "Warszawski Drift Classic",
    description: "Archiwalna runda driftowa sezonu.",
    category: "Drift",
    date: new Date("2026-03-24"),
    time: "15:00",
    track: "Tor Słomczyn",
    city: "Słomczyn",
    voivodeship: "Mazowieckie",
    imageUrl:
      "https://images.unsplash.com/photo-1617130627248-0bf361f6556a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    lat: 52.0376,
    lng: 20.7589,
    status: "ARCHIVED" as const,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@raceportal.pl" },
    update: {},
    create: {
      email: "admin@raceportal.pl",
      username: "Administrator",
      passwordHash,
      role: "ADMIN",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    },
  });

  const organizer = await prisma.user.upsert({
    where: { email: "org@raceportal.pl" },
    update: {},
    create: {
      email: "org@raceportal.pl",
      username: "Organizator",
      passwordHash: await bcrypt.hash("org123", 10),
      role: "ORGANIZER",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=organizer",
    },
  });

  const driver = await prisma.user.upsert({
    where: { email: "test@wp.pl" },
    update: {},
    create: {
      email: "test@wp.pl",
      username: "test",
      passwordHash: await bcrypt.hash("test123", 10),
      role: "USER",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=test",
    },
  });

  await prisma.car.deleteMany({ where: { userId: driver.id } });
  await prisma.car.createMany({
    data: [
      {
        userId: driver.id,
        make: "BMW",
        model: "M2",
        year: 2022,
        className: "GT4",
        plate: "WA 12345",
        imageUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800",
      },
      {
        userId: driver.id,
        make: "Porsche",
        model: "911 GT3",
        year: 2021,
        className: "Cup",
        plate: "GDA 98765",
        imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
      },
    ],
  });

  // Refresh demo events so dates stay relative to current season
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.event.createMany({
    data: eventsSeed.map((e) => ({ ...e, organizerId: organizer.id })),
  });

  console.log("Seed OK:", {
    admin: admin.email,
    organizer: organizer.email,
    driver: driver.email,
    events: await prisma.event.count(),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
