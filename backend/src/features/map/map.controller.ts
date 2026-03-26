import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMapLocations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Nieautoryzowany.' });
      return;
    }

    const COOLDOWN_MINUTES = 15;

    const locations = await prisma.location.findMany({
      include: {
        cooldowns: {
          where: { userId },
        },
      },
    });

    const now = new Date();
    const result = locations.map(({ cooldowns, ...location }) => {
      const lastLooted = cooldowns[0]?.lootedAt;
      const isOnCooldown =
        lastLooted !== undefined &&
        now.getTime() - lastLooted.getTime() < COOLDOWN_MINUTES * 60 * 1000;

      return { ...location, isOnCooldown };
    });

    res.json(result);
  } catch (error) {
    console.error('Błąd pobierania mapy:', error);
    res.status(500).json({ error: 'Nie udało się pobrać danych mapy.' });
  }
};

export const spawnDevLocation = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body as { lat?: number; lng?: number };

    if (lat === undefined || lng === undefined) {
      res.status(400).json({ error: 'Wymagane pola: lat, lng.' });
      return;
    }

    const location = await prisma.location.create({
      data: {
        name: 'Skrzynka Testowa',
        type: 'LOOT',
        latitude: lat,
        longitude: lng,
      },
    });

    res.status(201).json(location);
  } catch (error) {
    console.error('Błąd tworzenia dev lokacji:', error);
    res.status(500).json({ error: 'Nie udało się stworzyć lokacji.' });
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

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Nieautoryzowany.' });
      return;
    }

    const location = await prisma.location.findUnique({ where: { id: locationId } });

    if (!location) {
      return res.status(404).json({ error: 'Lokalizacja nie znaleziona' });
    }

    const COOLDOWN_MINUTES = 15;
    const now = new Date();

    const existingCooldown = await prisma.userLocationCooldown.findUnique({
      where: { userId_locationId: { userId, locationId } },
    });

    if (existingCooldown) {
      const elapsedMs = now.getTime() - existingCooldown.lootedAt.getTime();
      const elapsedMinutes = elapsedMs / (1000 * 60);

      if (elapsedMinutes < COOLDOWN_MINUTES) {
        const minutesLeft = Math.ceil(COOLDOWN_MINUTES - elapsedMinutes);
        return res.status(403).json({
          error: `To miejsce jest jeszcze puste. Wróć za ${minutesLeft} ${minutesLeft === 1 ? 'minutę' : 'minut'}.`,
          cooldownMinutesLeft: minutesLeft,
        });
      }
    }

    const emptyLootChance = Math.random();

    await prisma.userLocationCooldown.upsert({
      where: { userId_locationId: { userId, locationId } },
      update: { lootedAt: now },
      create: { userId, locationId, lootedAt: now },
    });

    if (emptyLootChance < 0.3) {
      return res.status(200).json({
        success: true,
        message: 'Przeszukałeś to miejsce i nic nie znaleziono. Ktoś tu był przed tobą.',
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
        error: 'Nie udało się wybrać przedmiotu.',
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
