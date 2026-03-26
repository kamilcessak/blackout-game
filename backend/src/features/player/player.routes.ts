import { Router } from 'express';
import { getPlayerStats, updateUsername, respawn } from './player.controller';
import { requireAuth } from '@/middleware/requireAuth';

const router = Router();

router.get('/stats', requireAuth, getPlayerStats);
router.patch('/username', requireAuth, updateUsername);
router.post('/respawn', requireAuth, respawn);

export default router;

