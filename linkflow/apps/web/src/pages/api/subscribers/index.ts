import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthTokenPayload } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return withAuth(handleGet)(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, user: AuthTokenPayload) {
  try {
    const db = getDb();
    const userId = user.userId;

    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 50;

    if (page < 1 || pageSize < 1 || pageSize > 500) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    const offset = (page - 1) * pageSize;

    const countResult = db.prepare(
      'SELECT COUNT(*) as total FROM subscribers WHERE user_id = ?'
    ).get(userId) as any;

    const total = (countResult?.total as number) || 0;

    const subscribers = db.prepare(
      `SELECT id, user_id, email, subscribed_at FROM subscribers
       WHERE user_id = ? ORDER BY subscribed_at DESC LIMIT ? OFFSET ?`
    ).all(userId, pageSize, offset);

    return res.status(200).json({
      subscribers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, email } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const db = getDb();
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const existing = db.prepare('SELECT id FROM subscribers WHERE user_id = ? AND email = ?').get(userId, email);
    if (existing) return res.status(400).json({ error: 'Already subscribed' });

    const subscriberId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO subscribers (id, user_id, email, subscribed_at) VALUES (?, ?, ?, ?)'
    ).run(subscriberId, userId, email, now);

    const newSubscriber = db.prepare(
      'SELECT id, user_id, email, subscribed_at FROM subscribers WHERE id = ?'
    ).get(subscriberId);

    return res.status(201).json(newSubscriber);
  } catch (error) {
    console.error('Create subscriber error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
