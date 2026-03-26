import { Router } from 'express';
import { getItems, createItem, getPlayers, killPlayer, healPlayer, spawnAirdrop } from './admin.controller';

const router = Router();

router.get('/items', getItems);
router.post('/items', createItem);

router.get('/players', getPlayers);
router.post('/players/:id/kill', killPlayer);
router.post('/players/:id/heal', healPlayer);

router.post('/airdrops', spawnAirdrop);

export default router;
