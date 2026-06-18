import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export const getItems = async (req: Request, res: Response) => {
  try {
    const items = await prisma.item.findMany();
    return res.status(200).json(items);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Nie udało się pobrać przedmiotów.' });
  }
};

export const createItem = async (req: Request, res: Response) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Pola name i type są wymagane.' });
    }

    const item = await prisma.item.create({
      data: { name, type },
    });

    return res.status(201).json(item);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Nie udało się utworzyć przedmiotu.' });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Nieprawidłowe ID przedmiotu.' });
    }

    const { name, type } = req.body as { name?: string; type?: string };
    if (
      (name !== undefined && typeof name !== 'string') ||
      (type !== undefined && typeof type !== 'string')
    ) {
      return res.status(400).json({ error: 'Pola name i type muszą być tekstem.' });
    }
    if (name === undefined && type === undefined) {
      return res.status(400).json({ error: 'Brak pól do aktualizacji.' });
    }

    const item = await prisma.item.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(type !== undefined && { type }),
      },
    });

    return res.status(200).json(item);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Przedmiot nie został znaleziony.' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Nie udało się zaktualizować przedmiotu.' });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Nieprawidłowe ID przedmiotu.' });
    }

    await prisma.item.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Przedmiot nie został znaleziony.' });
      }
      // P2003 — przedmiot jest używany w ekwipunku / airdropie (klucz obcy).
      if (error.code === 'P2003') {
        return res.status(409).json({
          error: 'Nie można usunąć — przedmiot jest używany w ekwipunku lub zrzucie.',
        });
      }
    }
    console.error(error);
    return res.status(500).json({ error: 'Nie udało się usunąć przedmiotu.' });
  }
};

export const getPlayers = async (req: Request, res: Response) => {
  try {
    const players = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        hp: true,
        hunger: true,
        thirst: true,
        xp: true,
        level: true,
      },
    });
    return res.status(200).json(players);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Nie udało się pobrać graczy.' });
  }
};

export const killPlayer = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const player = await prisma.user.update({
      where: { id },
      data: { hp: 0 },
    });

    return res.status(200).json(player);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Nie udało się zabić gracza.' });
  }
};

export const healPlayer = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const player = await prisma.user.update({
      where: { id },
      data: { hp: 100, hunger: 100, thirst: 100 },
    });

    return res.status(200).json(player);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Nie udało się uleczyć gracza.' });
  }
};

export const setPlayerLevel = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { level, xp } = req.body as { level?: number; xp?: number };

    if (level == null || !Number.isInteger(level) || level < 1) {
      return res.status(400).json({ error: 'Pole level jest wymagane i musi być liczbą >= 1.' });
    }

    // XP aktualizujemy WYŁĄCZNIE gdy zostało jawnie podane i jest poprawne.
    // Wcześniej brak xp w body kasował postęp gracza do 0 — niezamierzony efekt uboczny.
    const shouldUpdateXp = xp != null && Number.isInteger(xp) && xp >= 0;

    const player = await prisma.user.update({
      where: { id },
      data: {
        level,
        ...(shouldUpdateXp && { xp }),
      },
      select: { id: true, username: true, level: true, xp: true },
    });

    return res.status(200).json(player);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Nie udało się zmienić poziomu gracza.' });
  }
};

export const getGameConfig = async (_req: Request, res: Response) => {
  try {
    const config = await prisma.gameConfig.findFirst({ where: { id: 1 } });

    if (!config) {
      return res.status(404).json({ error: 'Konfiguracja gry nie została znaleziona.' });
    }

    return res.status(200).json(config);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Nie udało się pobrać konfiguracji gry.' });
  }
};

export const updateGameConfig = async (req: Request, res: Response) => {
  try {
    const { xpPerLoot, baseStorage, storagePerLevel, healAmount } = req.body as {
      xpPerLoot?: number;
      baseStorage?: number;
      storagePerLevel?: number;
      healAmount?: number;
    };

    const config = await prisma.gameConfig.upsert({
      where: { id: 1 },
      update: {
        ...(xpPerLoot != null && { xpPerLoot }),
        ...(baseStorage != null && { baseStorage }),
        ...(storagePerLevel != null && { storagePerLevel }),
        ...(healAmount != null && { healAmount }),
      },
      create: {
        id: 1,
        xpPerLoot: xpPerLoot ?? 10,
        baseStorage: baseStorage ?? 10,
        storagePerLevel: storagePerLevel ?? 5,
        healAmount: healAmount ?? 30,
      },
    });

    return res.status(200).json(config);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Nie udało się zaktualizować konfiguracji gry.' });
  }
};

export const spawnAirdrop = async (req: Request, res: Response) => {
  try {
    const { lat, lng, name, items } = req.body as {
      lat?: number;
      lng?: number;
      name?: string;
      items?: { itemId: number; quantity: number }[];
    };

    if (lat == null || lng == null) {
      return res.status(400).json({ error: 'Pola lat i lng są wymagane.' });
    }

    const hasItems = items && items.length > 0;

    const location = await prisma.location.create({
      data: {
        name: name?.trim() || 'Zrzut Wojskowy',
        type: 'AIRDROP',
        latitude: Number(lat),
        longitude: Number(lng),
        ...(hasItems && {
          airdropItems: {
            createMany: {
              data: items.map((i) => ({ itemId: i.itemId, quantity: i.quantity })),
            },
          },
        }),
      },
      include: { airdropItems: { include: { item: true } } },
    });

    return res.status(201).json(location);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Nie udało się utworzyć zrzutu.' });
  }
};

export const getAirdrops = async (_req: Request, res: Response) => {
  try {
    const airdrops = await prisma.location.findMany({
      where: { type: 'AIRDROP' },
      orderBy: { createdAt: 'desc' },
      include: { airdropItems: { include: { item: true } } },
    });

    return res.status(200).json(airdrops);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Nie udało się pobrać zrzutów.' });
  }
};

export const deleteAirdrop = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Nieprawidłowe ID zrzutu.' });
    }

    // Tylko lokacje typu AIRDROP — nie pozwalamy skasować zwykłych punktów na mapie.
    const location = await prisma.location.findUnique({ where: { id } });
    if (!location || location.type !== 'AIRDROP') {
      return res.status(404).json({ error: 'Zrzut nie został znaleziony.' });
    }

    // airdropItems mają onDelete: Cascade; cooldowny czyścimy ręcznie.
    await prisma.userLocationCooldown.deleteMany({ where: { locationId: id } });
    await prisma.location.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Nie udało się usunąć zrzutu.' });
  }
};
