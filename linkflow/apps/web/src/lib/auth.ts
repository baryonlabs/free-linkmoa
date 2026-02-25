import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { getDb } from './db';
import type { NextApiRequest, NextApiResponse } from 'next';

const JWT_SECRET = process.env.JWT_SECRET || 'linkflow-dev-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

export interface AuthTokenPayload {
  userId: string;
  username: string;
  email: string;
}

export type AuthResult =
  | { success: true; token: string; user: { id: string; username: string; email: string } }
  | { success: false; error: string };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY as any });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}

export function getTokenFromRequest(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const cookieToken = req.cookies?.token;
  return cookieToken || null;
}

export function getUserFromRequest(req: NextApiRequest): AuthTokenPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

// Middleware-style auth check
export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, user: AuthTokenPayload) => Promise<any>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    return handler(req, res, user);
  };
}

export function registerUser(username: string, email: string, password: string): AuthResult {
  const db = getDb();
  const id = uuid();
  const profileId = uuid();
  const passwordHash = bcrypt.hashSync(password, 12);

  const insertUser = db.prepare(
    'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)'
  );
  const insertProfile = db.prepare(
    'INSERT INTO profiles (id, user_id, title, bio, social_links) VALUES (?, ?, ?, ?, ?)'
  );

  try {
    db.exec('BEGIN TRANSACTION');
    try {
      insertUser.run(id, username.toLowerCase(), email.toLowerCase(), passwordHash);
      insertProfile.run(profileId, id, username, '', '{}');
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('UNIQUE constraint failed')) {
      if (msg.includes('users.username')) return { success: false, error: 'Username already taken' };
      if (msg.includes('users.email')) return { success: false, error: 'Email already registered' };
      return { success: false, error: 'Username or email already taken' };
    }
    throw err;
  }

  const lowerUsername = username.toLowerCase();
  const lowerEmail = email.toLowerCase();
  const token = generateToken({ userId: id, username: lowerUsername, email: lowerEmail });
  return { success: true, token, user: { id, username: lowerUsername, email: lowerEmail } };
}

export function loginUser(emailOrUsername: string, password: string): AuthResult {
  const db = getDb();
  const lower = emailOrUsername.toLowerCase();
  const user = db.prepare(
    'SELECT * FROM users WHERE email = ? OR username = ?'
  ).get(lower, lower) as any;

  if (!user) return { success: false, error: 'Invalid credentials' };

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return { success: false, error: 'Invalid credentials' };

  const token = generateToken({ userId: user.id, username: user.username, email: user.email });
  return { success: true, token, user: { id: user.id, username: user.username, email: user.email } };
}
