import { Router } from 'express';
import { getPlayerStats, updateUsername } from './player.controller';
import { requireAuth } from '@/middleware/requireAuth';

const router = Router();

router.get('/stats', requireAuth, getPlayerStats);
router.patch('/username', requireAuth, updateUsername);

export default router;

