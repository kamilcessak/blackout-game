import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMapLocations = async (req: Request, res: Response) => {
  try {
    const locations = await prisma.location.findMany();

    res.json(locations);
  } catch (error) {
    console.error('Błąd pobierania mapy:', error);
    res.status(500).json({ error: 'Nie udało się pobrać danych mapy.' });
  }
};

export const lootOnLocation = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;

    if (!idParam || typeof idParam !== 'string') {
      res.status(400).json({ error: 'Nieprawidłowe ID lokacji.' });
      return;
    }

    const locationId = parseInt(idParam, 10);

    if (isNaN(locationId)) {
      res.status(400).json({ error: 'ID lokacji musi być liczbą.' });
      return;
    }

    // HARDCODED FOR NOW - TODO: Make auth and get userId from request
    const userId = 1;

    const location = await prisma.location.findUnique({ where: { id: locationId } });

    if (!location) {
      return res.status(404).json({ error: 'Lokalizacja nie znaleziona' });
    }

    const emptyLootChance = Math.random();
    if (emptyLootChance < 0.3) {
      return res.status(200).json({
        success: true,
        message: 'Przeszukałeś to miejsce i nic nie znaleziono. Ktoś tu był przed tobą.',
      });
    }

    const allItems = await prisma.item.findMany();
    if (allItems.length === 0) {
      return res.status(500).json({
        error: 'Brak przedmiotów w bazie danych.',
      });
    }

    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
    if (!randomItem) {
      return res.status(500).json({
        error: 'Nie udało się wybrać przedmiotu.',
      });
    }

    const inventoryEntry = await prisma.inventoryItem.upsert({
      where: {
        userId_itemId: {
          userId: userId,
          itemId: randomItem.id,
        },
      },
      update: {
        quantity: { increment: 1 },
      },
      create: {
        userId: userId,
        itemId: randomItem.id,
        quantity: 1,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Znaleziono ${randomItem.name} w ilości ${inventoryEntry.quantity}.`,
      item: randomItem,
      totalQuantity: inventoryEntry.quantity,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Wystąpił błąd podczas próby znalezienia przedmiotu.',
    });
  }
};
