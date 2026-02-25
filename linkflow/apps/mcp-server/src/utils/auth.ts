import jwt from 'jsonwebtoken';
import { getDatabase } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export function verifyToken(token: string): TokenPayload {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function getCurrentUserId(): string {
  const token = process.env.LINKFLOW_TOKEN;

  if (!token) {
    throw new Error('LINKFLOW_TOKEN environment variable not set');
  }

  const payload = verifyToken(token);
  return payload.userId;
}

export function getCurrentUserEmail(): string {
  const token = process.env.LINKFLOW_TOKEN;

  if (!token) {
    throw new Error('LINKFLOW_TOKEN environment variable not set');
  }

  const payload = verifyToken(token);
  return payload.email;
}

export function validateUserAccess(userId: string): boolean {
  try {
    const currentUserId = getCurrentUserId();
    return currentUserId === userId;
  } catch {
    return false;
  }
}

export function getUserFromToken(): { id: string; email: string } {
  const token = process.env.LINKFLOW_TOKEN;

  if (!token) {
    throw new Error('LINKFLOW_TOKEN environment variable not set');
  }

  const payload = verifyToken(token);

  // Verify user exists in database
  const db = getDatabase();
  const user = db
    .prepare('SELECT id, email FROM users WHERE id = ?')
    .get(payload.userId);

  if (!user) {
    throw new Error('User not found');
  }

  return user as { id: string; email: string };
}
