import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export type UserRole = 'USER' | 'ADMIN';

export interface JwtPayload {
  userId: number;
  role: UserRole;
}

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
