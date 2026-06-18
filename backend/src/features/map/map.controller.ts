import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { calculateDistance } from '../../utils/distance';
import { processXpGain } from '../../utils/xp';
import { prisma } from '../../lib/prisma';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Twardy timeout na pojedyncze zapytanie do Overpass — bez tego wiszący endpoint
// blokowałby request gracza w nieskończoność (Overpass potrafi nie odpowiadać).
const OVERPASS_TIMEOUT_MS = 15_000;

async function fetchOverpass(query: string): Promise<globalThis.Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < OVERPASS_ENDPOINTS.length; attempt++) {
    const url = OVERPASS_ENDPOINTS[attempt]!;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);
    try {
      const fetchRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      if (fetchRes.ok) return fetchRes;

      console.warn(`Overpass endpoint ${url} returned ${fetchRes.status}, trying next...`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Overpass endpoint ${url} failed: ${lastError.message}, trying next...`);
    } finally {
      clearTimeout(timeout);
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
      res
        .status(502)
        .json({
          error: 'Serwery OpenStreetMap są chwilowo niedostępne. Spróbuj ponownie za chwilę.',
        });
      return;
    }

    const json = (await overpassRes.json()) as unknown as { elements: OverpassElement[] };
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

async function getGameConfig() {
  const config = await prisma.gameConfig.findFirst({ where: { id: 1 } });
  return config ?? { xpPerLoot: 10, baseStorage: 10, storagePerLevel: 5 };
}

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

    const { lat, lng } = req.body as { lat?: number; lng?: number };

    if (lat === undefined || lng === undefined) {
      res.status(400).json({ error: 'Wymagane pola: lat, lng.' });
      return;
    }

    const config = await getGameConfig();
    const COOLDOWN_MINUTES = 15;

    // Cały loot w jednej transakcji (Serializable). Pojemność plecaka, cooldown,
    // dodanie przedmiotu, naliczenie XP i usunięcie airdropu muszą być atomowe — bez
    // tego double-tap pozwala przekroczyć plecak, farmić XP i wywołać 500 przy
    // podwójnym usunięciu airdropu. Serializable sprawia, że równoległy konflikt
    // jednej z transakcji jest odrzucany (P2034 obsłużony niżej).
    const result = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, xp: true, level: true },
        });
        if (!user) return { status: 404, body: { error: 'Gracz nie został znaleziony.' } };

        const location = await tx.location.findUnique({ where: { id: locationId } });
        if (!location) return { status: 404, body: { error: 'Lokalizacja nie znaleziona' } };

        const dist = calculateDistance(lat, lng, location.latitude, location.longitude);
        if (dist > 50) {
          return {
            status: 403,
            body: { error: 'Jesteś za daleko od tego punktu (Weryfikacja serwera)!' },
          };
        }

        const maxCapacity = config.baseStorage + user.level * config.storagePerLevel;
        const backpackSum = await tx.inventoryItem.aggregate({
          where: { userId },
          _sum: { quantity: true },
        });
        if ((backpackSum._sum.quantity ?? 0) >= maxCapacity) {
          return {
            status: 400,
            body: { error: `Twój plecak jest pełny! (Limit: ${maxCapacity})` },
          };
        }

        const now = new Date();
        const existingCooldown = await tx.userLocationCooldown.findUnique({
          where: { userId_locationId: { userId, locationId } },
        });

        if (existingCooldown) {
          const elapsedMinutes =
            (now.getTime() - existingCooldown.lootedAt.getTime()) / (1000 * 60);
          if (elapsedMinutes < COOLDOWN_MINUTES) {
            const minutesLeft = Math.ceil(COOLDOWN_MINUTES - elapsedMinutes);
            return {
              status: 403,
              body: {
                error: `To miejsce jest jeszcze puste. Wróć za ${minutesLeft} ${minutesLeft === 1 ? 'minutę' : 'minut'}.`,
                cooldownMinutesLeft: minutesLeft,
              },
            };
          }
        }

        const isAirdrop = location.type === 'AIRDROP';

        if (!isAirdrop) {
          await tx.userLocationCooldown.upsert({
            where: { userId_locationId: { userId, locationId } },
            update: { lootedAt: now },
            create: { userId, locationId, lootedAt: now },
          });
        }

        if (isAirdrop) {
          const airdropItems = await tx.airdropItem.findMany({
            where: { locationId },
            include: { item: true },
          });

          if (airdropItems.length > 0) {
            const lootedNames: string[] = [];
            for (const ai of airdropItems) {
              await tx.inventoryItem.upsert({
                where: { userId_itemId: { userId, itemId: ai.itemId } },
                update: { quantity: { increment: ai.quantity } },
                create: { userId, itemId: ai.itemId, quantity: ai.quantity },
              });
              lootedNames.push(`${ai.item.name} x${ai.quantity}`);
            }

            const airdropXp = processXpGain(user.xp, user.level, config.xpPerLoot);
            await tx.user.update({
              where: { id: userId },
              data: { xp: airdropXp.xp, level: airdropXp.level },
            });

            await tx.userLocationCooldown.deleteMany({ where: { locationId } });
            // deleteMany zamiast delete — idempotentne, nie rzuca 500 gdy airdrop już zniknął.
            await tx.location.deleteMany({ where: { id: locationId } });

            return {
              status: 200,
              body: {
                success: true,
                message: `Zrzut przeszukany! Znaleziono: ${lootedNames.join(', ')}.`,
                xpGained: config.xpPerLoot,
                xp: airdropXp.xp,
                level: airdropXp.level,
                leveledUp: airdropXp.leveledUp,
              },
            };
          }

          // Fallback: airdrop bez zdefiniowanych itemów — losowy przedmiot.
          const allItems = await tx.item.findMany();
          if (allItems.length === 0) {
            await tx.userLocationCooldown.deleteMany({ where: { locationId } });
            await tx.location.deleteMany({ where: { id: locationId } });
            return {
              status: 200,
              body: { success: true, message: 'Zrzut przeszukany, ale był pusty.' },
            };
          }

          const randomItem = allItems[Math.floor(Math.random() * allItems.length)]!;
          await tx.inventoryItem.upsert({
            where: { userId_itemId: { userId, itemId: randomItem.id } },
            update: { quantity: { increment: 1 } },
            create: { userId, itemId: randomItem.id, quantity: 1 },
          });

          const fallbackXp = processXpGain(user.xp, user.level, config.xpPerLoot);
          await tx.user.update({
            where: { id: userId },
            data: { xp: fallbackXp.xp, level: fallbackXp.level },
          });

          await tx.userLocationCooldown.deleteMany({ where: { locationId } });
          await tx.location.deleteMany({ where: { id: locationId } });

          return {
            status: 200,
            body: {
              success: true,
              message: `Zrzut przeszukany! Znaleziono: ${randomItem.name}.`,
              item: randomItem,
              xpGained: config.xpPerLoot,
              xp: fallbackXp.xp,
              level: fallbackXp.level,
              leveledUp: fallbackXp.leveledUp,
            },
          };
        }

        if (Math.random() < 0.3) {
          return {
            status: 200,
            body: {
              success: true,
              message: 'Przeszukałeś to miejsce i nic nie znaleziono. Ktoś tu był przed tobą.',
            },
          };
        }

        const allItems = await tx.item.findMany();
        if (allItems.length === 0) {
          return { status: 500, body: { error: 'Brak przedmiotów w bazie danych.' } };
        }

        const LOCATION_LOOT_WEIGHTS: Record<string, Record<string, number>> = {
          WATER: { WATER: 6, FOOD: 1, MEDKIT: 1, RESOURCE: 1 },
          FOOD: { FOOD: 6, WATER: 1, MEDKIT: 1, RESOURCE: 1 },
          MEDICAL: { MEDKIT: 6, WATER: 2, FOOD: 1, RESOURCE: 1 },
        };

        const weights = LOCATION_LOOT_WEIGHTS[location.type] ?? {};
        const weightedPool = allItems.flatMap((item) => {
          const w = weights[item.type] ?? 1;
          return Array(w).fill(item);
        });

        const randomItem = weightedPool[Math.floor(Math.random() * weightedPool.length)];
        if (!randomItem) {
          return { status: 500, body: { error: 'Nie udało się wybrać przedmiotu.' } };
        }

        const inventoryEntry = await tx.inventoryItem.upsert({
          where: { userId_itemId: { userId, itemId: randomItem.id } },
          update: { quantity: { increment: 1 } },
          create: { userId, itemId: randomItem.id, quantity: 1 },
        });

        const xpResult = processXpGain(user.xp, user.level, config.xpPerLoot);
        await tx.user.update({
          where: { id: userId },
          data: { xp: xpResult.xp, level: xpResult.level },
        });

        return {
          status: 200,
          body: {
            success: true,
            message: `Znaleziono ${randomItem.name} w ilości ${inventoryEntry.quantity}.`,
            item: randomItem,
            totalQuantity: inventoryEntry.quantity,
            xpGained: config.xpPerLoot,
            xp: xpResult.xp,
            level: xpResult.level,
            leveledUp: xpResult.leveledUp,
          },
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return res.status(result.status).json(result.body);
  } catch (error) {
    // P2034 = konflikt serializacji / zakleszczenie — typowe przy double-tap. Klient może ponowić.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return res.status(409).json({
        error: 'Zbyt szybkie powtórne lootowanie. Spróbuj ponownie.',
      });
    }
    console.error(error);
    return res.status(500).json({
      error: 'Wystąpił błąd podczas próby znalezienia przedmiotu.',
    });
  }
};
