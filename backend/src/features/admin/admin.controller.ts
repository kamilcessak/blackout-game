import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export const getPlayers = async (req: Request, res: Response) => {
  try {
    const players = await prisma.user.findMany({
      select: { id: true, username: true, email: true, hp: true, hunger: true, thirst: true },
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
