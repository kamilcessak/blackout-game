import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const startSurvivalTick = () => {
  cron.schedule('* * * * *', async () => {
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
  });
};

