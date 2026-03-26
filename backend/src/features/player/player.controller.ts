import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPlayerStats = async (req: Request, res: Response) => {
  try {
    // HARDCODED FOR NOW - TODO: Make auth and get userId from request
    const userId = 1;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hp: true, hunger: true, thirst: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Gracz nie został znaleziony.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas pobierania statystyk gracza.' });
  }
};

