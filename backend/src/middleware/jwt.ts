import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

const JWT_SECRET = env.JWT_SECRET;

export type UserRole = 'USER' | 'ADMIN';

export interface JwtPayload {
  userId: number;
  role: UserRole;
}

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
