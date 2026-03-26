import { Router } from 'express';
import {
  getItems,
  createItem,
  getPlayers,
  killPlayer,
  healPlayer,
  setPlayerLevel,
  spawnAirdrop,
  getGameConfig,
  updateGameConfig,
} from './admin.controller';

const router = Router();

router.get('/items', getItems);
router.post('/items', createItem);

router.get('/players', getPlayers);
router.post('/players/:id/kill', killPlayer);
router.post('/players/:id/heal', healPlayer);
router.patch('/players/:id/level', setPlayerLevel);

router.post('/airdrops', spawnAirdrop);

router.get('/config', getGameConfig);
router.patch('/config', updateGameConfig);

export default router;
