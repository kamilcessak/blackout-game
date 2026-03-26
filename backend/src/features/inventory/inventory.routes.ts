import { Router } from 'express';
import { consumeItem, craftItem, getPlayerInventory } from './inventory.controller';
import { requireAuth } from '@/middleware/requireAuth';

const router = Router();

router.get('/player', requireAuth, getPlayerInventory);
router.post('/craft', requireAuth, craftItem);
router.post('/:itemId/consume', requireAuth, consumeItem);

export default router;
