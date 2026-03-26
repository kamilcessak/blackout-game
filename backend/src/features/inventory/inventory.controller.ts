import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPlayerInventory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Nieautoryzowany.' });
    }

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
      return res.status(200).json([]);
    }

    return res.status(200).json(inventory);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas pobierania ekwipunku.' });
  }
};

export const consumeItem = async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.itemId);
    if (!Number.isFinite(itemId)) {
      return res.status(400).json({ error: 'Nieprawidłowe itemId.' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Nieautoryzowany.' });
    }

    const inventoryEntry = await prisma.inventoryItem.findUnique({
      where: {
        userId_itemId: {
          userId,
          itemId,
        },
      },
      include: {
        item: true,
      },
    });

    if (!inventoryEntry) {
      return res.status(404).json({ error: 'Nie posiadasz tego przedmiotu w ekwipunku.' });
    }

    const delta = 30;

    const updatedStats = await prisma.$transaction(async (tx) => {
      if (inventoryEntry.quantity <= 1) {
        await tx.inventoryItem.delete({
          where: {
            userId_itemId: {
              userId,
              itemId,
            },
          },
        });
      } else {
        await tx.inventoryItem.update({
          where: {
            userId_itemId: {
              userId,
              itemId,
            },
          },
          data: {
            quantity: inventoryEntry.quantity - 1,
          },
        });
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { hp: true, hunger: true, thirst: true },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const data: { hp?: number; hunger?: number; thirst?: number } = {};

      if (inventoryEntry.item.type === 'FOOD') {
        data.hunger = Math.min(100, user.hunger + delta);
      } else if (inventoryEntry.item.type === 'WATER') {
        data.thirst = Math.min(100, user.thirst + delta);
      } else if (inventoryEntry.item.type === 'MEDKIT') {
        data.hp = Math.min(100, user.hp + delta);
      } else {
        // Unknown type - keep stats unchanged
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data,
        select: { hp: true, hunger: true, thirst: true },
      });

      return updatedUser;
    });

    return res.status(200).json({
      message: 'Przedmiot został zużyty.',
      stats: updatedStats,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas zużywania przedmiotu.' });
  }
};
