import { Router } from 'express';
import { getMapLocations, lootOnLocation } from './map.controller';
import { requireAuth } from '@/middleware/requireAuth';

const router = Router();

router.get('/locations', requireAuth, getMapLocations);
router.post('/locations/:id/loot', requireAuth, lootOnLocation);

export default router;
