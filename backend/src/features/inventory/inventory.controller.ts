import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPlayerInventory = async (req: Request, res: Response) => {
  try {
    // HARDCODED FOR NOW - TODO: Make auth and get userId from request
    const userId = 1;

    const inventory = await prisma.inventoryItem.findMany({
      where: { userId },
      include: {
        item: true,
      },
      orderBy: {
        quantity: 'desc',
      },
    });

    if (!inventory || inventory.length === 0) {
      return res.status(404).json({
        error: 'Brak przedmiotów w ekwipunku.',
      });
    }

    return res.status(200).json(inventory);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas pobierania ekwipunku.' });
  }
};
