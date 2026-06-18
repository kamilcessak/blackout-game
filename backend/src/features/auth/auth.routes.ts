import { Router } from 'express';
import { register, login } from './auth.controller';
import { rateLimit } from '@/middleware/rateLimit';

const router = Router();

// Ochrona przed brute-force: limit prób na IP w oknie czasowym.
const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  message: 'Zbyt wiele prób logowania. Spróbuj ponownie za kilka minut.',
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60_000,
  max: 20,
  message: 'Zbyt wiele prób rejestracji. Spróbuj ponownie później.',
});

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);

export default router;
