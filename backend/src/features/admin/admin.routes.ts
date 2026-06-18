import { Router } from 'express';
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  getPlayers,
  killPlayer,
  healPlayer,
  setPlayerLevel,
  spawnAirdrop,
  getAirdrops,
  deleteAirdrop,
  getGameConfig,
  updateGameConfig,
} from './admin.controller';
import { requireAuth } from '@/middleware/requireAuth';
import { requireAdmin } from '@/middleware/requireAdmin';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/items', getItems);
router.post('/items', createItem);
router.patch('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);

router.get('/players', getPlayers);
router.post('/players/:id/kill', killPlayer);
router.post('/players/:id/heal', healPlayer);
router.patch('/players/:id/level', setPlayerLevel);

router.get('/airdrops', getAirdrops);
router.post('/airdrops', spawnAirdrop);
router.delete('/airdrops/:id', deleteAirdrop);

router.get('/config', getGameConfig);
router.patch('/config', updateGameConfig);

export default router;
