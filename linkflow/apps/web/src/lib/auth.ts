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

export async function registerUser(
  username: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const db = await getDb();
  const id = uuid();
  const profileId = uuid();
  const passwordHash = await hashPassword(password);

  try {
    await db.batch(
      [
        {
          sql: 'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)',
          args: [id, username.toLowerCase(), email.toLowerCase(), passwordHash],
        },
        {
          sql: 'INSERT INTO profiles (id, user_id, title, bio, social_links) VALUES (?, ?, ?, ?, ?)',
          args: [profileId, id, username, '', '{}'],
        },
      ],
      'write'
    );
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('UNIQUE')) {
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

export async function loginUser(emailOrUsername: string, password: string): Promise<AuthResult> {
  const db = await getDb();
  const lower = emailOrUsername.toLowerCase();

  const { rows } = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ? OR username = ?',
    args: [lower, lower],
  });

  const user = rows[0] as any;
  if (!user) return { success: false, error: 'Invalid credentials' };

  const valid = await verifyPassword(password, user.password_hash as string);
  if (!valid) return { success: false, error: 'Invalid credentials' };

  const token = generateToken({
    userId: user.id as string,
    username: user.username as string,
    email: user.email as string,
  });
  return {
    success: true,
    token,
    user: { id: user.id as string, username: user.username as string, email: user.email as string },
  };
}
