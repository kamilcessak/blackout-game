import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwt';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Brak tokena autoryzacji.' });
    return;
  }

  const token = authHeader.split(' ')[1] ?? '';

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch {
    res.status(403).json({ error: 'Nieważny lub wygasły token.' });
  }
};
