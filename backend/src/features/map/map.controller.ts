import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchOverpass(query: string): Promise<globalThis.Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < OVERPASS_ENDPOINTS.length; attempt++) {
    const url = OVERPASS_ENDPOINTS[attempt]!;
    try {
      const fetchRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (fetchRes.ok) return fetchRes;

      console.warn(`Overpass endpoint ${url} returned ${fetchRes.status}, trying next...`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Overpass endpoint ${url} failed: ${lastError.message}, trying next...`);
    }

    if (attempt < OVERPASS_ENDPOINTS.length - 1) {
      await sleep(1000 * (attempt + 1));
    }
  }

  throw lastError ?? new Error('All Overpass endpoints failed');
}

type OsmLocationType = 'FOOD' | 'MEDICAL' | 'WATER';

interface OverpassElement {
  id: number;
  lat: number;
  lon: number;
  tags?: {
    name?: string;
    shop?: string;
    amenity?: string;
    natural?: string;
  };
}

function resolveOsmType(tags: OverpassElement['tags']): OsmLocationType | null {
  if (!tags) return null;
  if (tags.shop === 'supermarket' || tags.shop === 'convenience') return 'FOOD';
  if (tags.amenity === 'pharmacy') return 'MEDICAL';
  if (tags.natural === 'water') return 'WATER';
  return null;
}

function resolveOsmName(tags: OverpassElement['tags'], type: OsmLocationType): string {
  if (tags?.name) return tags.name;
  if (type === 'FOOD') return 'Opuszczony Sklep';
  if (type === 'MEDICAL') return 'Opuszczona Apteka';
  return 'Zbiornik Wody';
}

export const scanArea = async (req: Request, res: Response) => {
  try {
    const rawLat = req.body?.lat ?? req.query?.lat;
    const rawLon = req.body?.lon ?? req.query?.lon;

    const lat = Number(rawLat);
    const lon = Number(rawLon);

    if (!rawLat || !rawLon || isNaN(lat) || isNaN(lon)) {
      res.status(400).json({ error: 'Wymagane pola: lat, lon (liczby).' });
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      res.status(400).json({ error: 'Nieprawidłowe współrzędne geograficzne.' });
      return;
    }

    const query = `
      [out:json];
      (
        node["shop"="supermarket"](around:1000,${lat},${lon});
        node["shop"="convenience"](around:1000,${lat},${lon});
        node["amenity"="pharmacy"](around:1000,${lat},${lon});
        node["natural"="water"](around:1000,${lat},${lon});
      );
      out;
    `;

    let overpassRes: globalThis.Response;
    try {
      overpassRes = await fetchOverpass(query);
    } catch (err) {
      console.error('Overpass API unavailable:', err);
      res.status(502).json({ error: 'Serwery OpenStreetMap są chwilowo niedostępne. Spróbuj ponownie za chwilę.' });
      return;
    }

    const json = await overpassRes.json() as unknown as { elements: OverpassElement[] };
    const elements: OverpassElement[] = json.elements ?? [];

    const toInsert = elements
      .map((el) => {
        const type = resolveOsmType(el.tags);
        if (!type) return null;
        return {
          name: resolveOsmName(el.tags, type),
          type,
          latitude: el.lat,
          longitude: el.lon,
          osmId: el.id.toString(),
        };
      })
      .filter((el): el is NonNullable<typeof el> => el !== null);

    await prisma.location.createMany({
      data: toInsert,
      skipDuplicates: true,
    });

    const allLocations = await prisma.location.findMany();

    res.status(200).json({
      scanned: toInsert.length,
      locations: allLocations,
    });
  } catch (error) {
    console.error('Błąd skanowania okolicy:', error);
    res.status(500).json({ error: 'Nie udało się zeskanować okolicy.' });
  }
};

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

    const isAirdrop = location.type === 'AIRDROP';

    if (!isAirdrop) {
      await prisma.userLocationCooldown.upsert({
        where: { userId_locationId: { userId, locationId } },
        update: { lootedAt: now },
        create: { userId, locationId, lootedAt: now },
      });
    }

    if (isAirdrop) {
      const airdropItems = await prisma.airdropItem.findMany({
        where: { locationId },
        include: { item: true },
      });

      if (airdropItems.length > 0) {
        const lootedNames: string[] = [];

        for (const ai of airdropItems) {
          await prisma.inventoryItem.upsert({
            where: { userId_itemId: { userId, itemId: ai.itemId } },
            update: { quantity: { increment: ai.quantity } },
            create: { userId, itemId: ai.itemId, quantity: ai.quantity },
          });
          lootedNames.push(`${ai.item.name} x${ai.quantity}`);
        }

        await prisma.userLocationCooldown.deleteMany({ where: { locationId } });
        await prisma.location.delete({ where: { id: locationId } });

        return res.status(200).json({
          success: true,
          message: `Zrzut przeszukany! Znaleziono: ${lootedNames.join(', ')}.`,
        });
      }

      // Fallback: airdrop without predefined items — give one random item
      const allItems = await prisma.item.findMany();
      if (allItems.length === 0) {
        await prisma.userLocationCooldown.deleteMany({ where: { locationId } });
        await prisma.location.delete({ where: { id: locationId } });
        return res.status(200).json({
          success: true,
          message: 'Zrzut przeszukany, ale był pusty.',
        });
      }

      const randomItem = allItems[Math.floor(Math.random() * allItems.length)]!;
      await prisma.inventoryItem.upsert({
        where: { userId_itemId: { userId, itemId: randomItem.id } },
        update: { quantity: { increment: 1 } },
        create: { userId, itemId: randomItem.id, quantity: 1 },
      });

      await prisma.userLocationCooldown.deleteMany({ where: { locationId } });
      await prisma.location.delete({ where: { id: locationId } });

      return res.status(200).json({
        success: true,
        message: `Zrzut przeszukany! Znaleziono: ${randomItem.name}.`,
        item: randomItem,
      });
    }

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

    const LOCATION_LOOT_WEIGHTS: Record<string, Record<string, number>> = {
      WATER:   { WATER: 6, FOOD: 1, MEDKIT: 1, RESOURCE: 1 },
      FOOD:    { FOOD: 6,  WATER: 1, MEDKIT: 1, RESOURCE: 1 },
      MEDICAL: { MEDKIT: 6, WATER: 2, FOOD: 1, RESOURCE: 1 },
    };

    const weights = LOCATION_LOOT_WEIGHTS[location.type] ?? {};
    const weightedPool = allItems.flatMap((item) => {
      const w = weights[item.type] ?? 1;
      return Array(w).fill(item);
    });

    const randomItem = weightedPool[Math.floor(Math.random() * weightedPool.length)];
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
