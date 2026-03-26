import { Router } from 'express';
import { consumeItem, getPlayerInventory } from './inventory.controller';

const router = Router();

router.get('/player', getPlayerInventory);
router.post('/:itemId/consume', consumeItem);

export default router;
