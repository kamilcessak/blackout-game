import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clearing old locations to avoid duplicates
  await prisma.location.deleteMany();

  // Adding new points (Ożarów and surroundings)
  const locations = [
    {
      name: "Stara Studnia",
      type: "WATER",
      description: "Zardzewiała pompa, ale woda wygląda na czystą.",
      latitude: 50.885,
      longitude: 21.67,
    },
    {
      name: 'Apteka "Pod Orłem"',
      type: "MEDICAL",
      description: "Wybite szyby, ale na zapleczu mogą być bandaże.",
      latitude: 50.8865,
      longitude: 21.672,
    },
    {
      name: "Opuszczony Supermarket",
      type: "SHOP",
      description: "Może zostało tu trochę jedzenia w puszce.",
      latitude: 50.883,
      longitude: 21.668,
    },
    {
      name: "Wojskowy Zrzut",
      type: "LOOT",
      description: "Skrzynia zrzucona z samolotu. Ryzykowne miejsce.",
      latitude: 50.888,
      longitude: 21.675,
    },
  ];

  for (const item of locations) {
    const result = await prisma.location.create({
      data: item,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
