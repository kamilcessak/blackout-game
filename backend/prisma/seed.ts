import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Rozpoczynam sadzenie danych...');

  // Czyszczenie starych danych
  await prisma.inventoryItem.deleteMany();
  await prisma.item.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  // Tworzenie testowego gracza z ID: 1
  const player = await prisma.user.create({
    data: {
      id: 1,
      email: 'kamil@kamil.pl',
      username: 'Survivor',
      hp: 100,
    },
  });
  console.log(`👤 Utworzono gracza ID: ${player.id}`);

  // Dodawanie puli przedmiotów do znalezienia
  const items = [
    { name: 'Brudna Woda', type: 'WATER' },
    { name: 'Konserwa Turystyczna', type: 'FOOD' },
    { name: 'Bandaż', type: 'MEDKIT' },
    { name: 'Złom', type: 'RESOURCE' },
  ];

  for (const item of items) {
    await prisma.item.create({ data: item });
  }
  console.log(`🎒 Dodano ${items.length} przedmiotów.`);

  // Dodawanie testowych lokacji
  const locations = [
    {
      name: 'Stara Studnia',
      type: 'WATER',
      description: 'Zardzewiała pompa, ale woda wygląda na czystą.',
      latitude: 50.885,
      longitude: 21.67,
    },
    {
      name: 'Apteka "Pod Orłem"',
      type: 'MEDICAL',
      description: 'Wybite szyby, ale na zapleczu mogą być bandaże.',
      latitude: 50.8865,
      longitude: 21.672,
    },
    {
      name: 'Opuszczony Supermarket',
      type: 'SHOP',
      description: 'Może zostało tu trochę jedzenia w puszce.',
      latitude: 50.883,
      longitude: 21.668,
    },
    {
      name: 'Wojskowy Zrzut',
      type: 'LOOT',
      description: 'Skrzynia zrzucona z samolotu. Ryzykowne miejsce.',
      latitude: 50.888,
      longitude: 21.675,
    },
  ];

  for (const loc of locations) {
    await prisma.location.create({ data: loc });
  }
  console.log(`🗺️ Dodano ${locations.length} lokacji.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
