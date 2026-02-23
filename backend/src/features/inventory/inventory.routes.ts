import { Router } from 'express';
import { getPlayerInventory } from './inventory.controller';

const router = Router();

router.get('/player', getPlayerInventory);

export default router;
