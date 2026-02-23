import { Router } from 'express';
import { getMapLocations, lootOnLocation } from './map.controller';

const router = Router();

router.get('/locations', getMapLocations);
router.post('/locations/:id/loot', lootOnLocation);

export default router;
