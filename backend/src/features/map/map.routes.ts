import { Router } from 'express';
import { getMapLocations, lootOnLocation, scanArea, spawnDevLocation } from './map.controller';
import { requireAuth } from '@/middleware/requireAuth';

const router = Router();

// Odpowiednik frontendowego __DEV__ — w produkcji ten cheat nie istnieje.
const isDev = process.env.NODE_ENV !== 'production';

router.get('/locations', requireAuth, getMapLocations);
router.post('/locations/scan', requireAuth, scanArea);
if (isDev) {
  // Deweloperski spawn lootu — pozwala stworzyć dowolny przedmiot w miejscu gracza.
  router.post('/locations/spawn', requireAuth, spawnDevLocation);
}
router.post('/locations/:id/loot', requireAuth, lootOnLocation);

export default router;
