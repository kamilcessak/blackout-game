import { PrismaClient } from '@prisma/client';

// Jeden współdzielony klient Prisma na cały proces. Wcześniej każdy kontroler tworzył
// własną instancję `new PrismaClient()`, co przy hot-reloadzie (nodemon/ts-node)
// wyczerpywało pulę połączeń do bazy. Cache w globalThis chroni przed mnożeniem
// instancji między przeładowaniami modułów w dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
