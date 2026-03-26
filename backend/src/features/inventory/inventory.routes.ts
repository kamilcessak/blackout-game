import { Router } from 'express';
import { consumeItem, getPlayerInventory } from './inventory.controller';
import { requireAuth } from '@/middleware/requireAuth';

const router = Router();

router.get('/player', requireAuth, getPlayerInventory);
router.post('/:itemId/consume', requireAuth, consumeItem);

export default router;
