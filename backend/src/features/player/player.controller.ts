import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPlayerStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Nieautoryzowany.' });
    }

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

