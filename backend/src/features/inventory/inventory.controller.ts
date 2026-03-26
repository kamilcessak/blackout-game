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

const recipes = [
  {
    id: 1,
    name: 'Oczyszczona Woda',
    type: 'WATER',
    ingredients: [
      { name: 'Brudna Woda', qty: 1 },
      { name: 'Złom', qty: 1 },
    ],
  },
  {
    id: 2,
    name: 'Apteczka',
    type: 'MEDKIT',
    ingredients: [
      { name: 'Bandaż', qty: 2 },
      { name: 'Złom', qty: 1 },
    ],
  },
];

export const craftItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Nieautoryzowany.' });
    }

    const recipeId = Number(req.body.recipeId);
    if (!Number.isFinite(recipeId)) {
      return res.status(400).json({ error: 'Nieprawidłowe recipeId.' });
    }

    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) {
      return res.status(404).json({ error: 'Nie znaleziono przepisu.' });
    }

    const playerInventory = await prisma.inventoryItem.findMany({
      where: { userId },
      include: { item: true },
    });

    for (const ingredient of recipe.ingredients) {
      const entry = playerInventory.find((inv) => inv.item.name === ingredient.name);
      if (!entry || entry.quantity < ingredient.qty) {
        return res.status(400).json({ error: 'Brak wymaganych składników.' });
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const ingredient of recipe.ingredients) {
        const entry = playerInventory.find((inv) => inv.item.name === ingredient.name)!;
        const newQty = entry.quantity - ingredient.qty;

        if (newQty <= 0) {
          await tx.inventoryItem.delete({
            where: { userId_itemId: { userId, itemId: entry.itemId } },
          });
        } else {
          await tx.inventoryItem.update({
            where: { userId_itemId: { userId, itemId: entry.itemId } },
            data: { quantity: newQty },
          });
        }
      }

      let craftedItem = await tx.item.findFirst({ where: { name: recipe.name } });
      if (!craftedItem) {
        craftedItem = await tx.item.create({
          data: { name: recipe.name, type: recipe.type },
        });
      }

      const existing = await tx.inventoryItem.findUnique({
        where: { userId_itemId: { userId, itemId: craftedItem.id } },
      });

      if (existing) {
        await tx.inventoryItem.update({
          where: { userId_itemId: { userId, itemId: craftedItem.id } },
          data: { quantity: existing.quantity + 1 },
        });
      } else {
        await tx.inventoryItem.create({
          data: { userId, itemId: craftedItem.id, quantity: 1 },
        });
      }
    });

    return res.status(200).json({ message: `Stworzono: ${recipe.name}.` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas craftingu.' });
  }
};
