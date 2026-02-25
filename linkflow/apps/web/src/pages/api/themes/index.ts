import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthTokenPayload } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export default withAuth(async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthTokenPayload) {
  const userId = user.userId;
  if (req.method === 'GET') {
    return handleGet(req, res, userId);
  } else if (req.method === 'POST') {
    return handlePost(req, res, userId);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});

async function handleGet(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const db = getDb();

    const builtinThemes = db.prepare(
      `SELECT id, name, type, config, created_at, updated_at FROM themes WHERE type = 'builtin'`
    ).all();

    const customThemes = db.prepare(
      `SELECT id, name, type, config, created_at, updated_at FROM themes WHERE user_id = ? AND type = 'custom'`
    ).all(userId);

    const allThemes = [...builtinThemes, ...customThemes].map((theme: any) => ({
      ...theme,
      config: theme.config ? JSON.parse(theme.config as string) : null,
    }));

    return res.status(200).json(allThemes);
  } catch (error) {
    console.error('Get themes error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const db = getDb();
    const { name, config } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Theme name is required' });
    }
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ error: 'Theme config is required and must be an object' });
    }

    const themeId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO themes (id, user_id, name, type, config, created_at, updated_at)
       VALUES (?, ?, ?, 'custom', ?, ?, ?)`
    ).run(themeId, userId, name, JSON.stringify(config), now, now);

    const newTheme = db.prepare(
      `SELECT id, name, type, config, created_at, updated_at FROM themes WHERE id = ?`
    ).get(themeId) as any;

    return res.status(201).json({
      ...newTheme,
      config: newTheme.config ? JSON.parse(newTheme.config as string) : null,
    });
  } catch (error) {
    console.error('Create theme error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
