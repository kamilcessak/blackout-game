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
