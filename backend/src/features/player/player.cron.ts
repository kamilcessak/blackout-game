import cron from 'node-cron';
import { prisma } from '../../lib/prisma';

export const startSurvivalTick = () => {
  cron.schedule('* * * * *', async () => {
    // Cały tick w try/catch — bez tego pojedynczy błąd zapytania to unhandled
    // rejection co minutę, który może ubić proces serwera.
    try {
      const users = await prisma.user.findMany({
        select: { id: true, hp: true, hunger: true, thirst: true },
      });

      for (const user of users) {
        const nextThirst = Math.max(0, user.thirst - 2);
        const nextHunger = Math.max(0, user.hunger - 1);

        const shouldLoseHp = nextThirst === 0 || nextHunger === 0;
        const nextHp = Math.max(0, user.hp - (shouldLoseHp ? 5 : 0));

        await prisma.user.update({
          where: { id: user.id },
          data: {
            thirst: nextThirst,
            hunger: nextHunger,
            hp: nextHp,
          },
        });
      }
    } catch (error) {
      console.error('Błąd w cyklu survival (cron):', error);
    }
  });
};

