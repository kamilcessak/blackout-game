import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const getPlayerStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Nieautoryzowany.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, hp: true, hunger: true, thirst: true, xp: true, level: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Gracz nie został znaleziony.' });
    }

    // Pojemność plecaka liczona z konfiguracji + poziomu — front nie musi jej hardkodować.
    const config = await prisma.gameConfig.findFirst({ where: { id: 1 } });
    const baseStorage = config?.baseStorage ?? 10;
    const storagePerLevel = config?.storagePerLevel ?? 5;
    const maxCapacity = baseStorage + user.level * storagePerLevel;

    return res.status(200).json({ ...user, maxCapacity });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas pobierania statystyk gracza.' });
  }
};

export const updateUsername = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Nieautoryzowany.' });
    }

    const { username } = req.body;
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return res.status(400).json({ error: 'Nazwa użytkownika nie może być pusta.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { username: username.trim() },
      select: { id: true, email: true, username: true },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas aktualizacji nazwy użytkownika.' });
  }
};

export const respawn = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Nieautoryzowany.' });
    }

    const player = await prisma.$transaction(async (tx) => {
      await tx.inventoryItem.deleteMany({ where: { userId } });

      return tx.user.update({
        where: { id: userId },
        data: { hp: 100, hunger: 100, thirst: 100, xp: 0, level: 1 },
        select: {
          id: true,
          username: true,
          hp: true,
          hunger: true,
          thirst: true,
          xp: true,
          level: true,
        },
      });
    });

    return res.status(200).json(player);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas odrodzenia gracza.' });
  }
};
