import { Router } from 'express';
import { getPlayerStats } from './player.controller';

const router = Router();

router.get('/stats', getPlayerStats);

export default router;

