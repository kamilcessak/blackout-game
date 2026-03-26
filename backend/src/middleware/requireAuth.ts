import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

interface JwtPayload {
  userId: number;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Brak tokena autoryzacji.' });
    return;
  }

  const token = authHeader.split(' ')[1] ?? '';

  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
    req.user = { id: payload.userId };
    next();
  } catch {
    res.status(403).json({ error: 'Nieważny lub wygasły token.' });
  }
};
