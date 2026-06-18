import { Router } from 'express';
import { getMapLocations, lootOnLocation, scanArea, spawnDevLocation } from './map.controller';
import { requireAuth } from '@/middleware/requireAuth';
import { rateLimit } from '@/middleware/rateLimit';

const router = Router();

// Odpowiednik frontendowego __DEV__ — w produkcji ten cheat nie istnieje.
const isDev = process.env.NODE_ENV !== 'production';

// Skan okolicy uderza w zewnętrzne Overpass — limitujemy, by jeden gracz nie zalał
// nas (i serwerów OSM) zapytaniami: maks. 10 skanów na minutę na gracza.
const scanLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: 'Zbyt wiele skanów okolicy. Odczekaj chwilę przed kolejnym.',
});

router.get('/locations', requireAuth, getMapLocations);
router.post('/locations/scan', requireAuth, scanLimiter, scanArea);
if (isDev) {
  // Deweloperski spawn lootu — pozwala stworzyć dowolny przedmiot w miejscu gracza.
  router.post('/locations/spawn', requireAuth, spawnDevLocation);
}
router.post('/locations/:id/loot', requireAuth, lootOnLocation);

export default router;
