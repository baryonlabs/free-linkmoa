import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthTokenPayload } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export default withAuth(async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthTokenPayload) {
  if (req.method === 'GET') {
    return handleGet(req, res, user.userId);
  } else if (req.method === 'POST') {
    return handlePost(req, res, user.userId);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});

async function handleGet(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const db = await getDb();
    const { rows } = await db.execute({
      sql: `SELECT id, user_id, title, url, description, type, icon_url, thumbnail_url,
              animation_type, highlight, enabled, scheduled_from, scheduled_to,
              utm_source, utm_medium, utm_campaign, custom_css, position,
              click_count, created_at, updated_at
       FROM links WHERE user_id = ? ORDER BY position ASC`,
      args: [userId],
    });
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Get links error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const db = await getDb();
    const {
      title, url, description, type, icon_url, thumbnail_url,
      animation_type, highlight, scheduled_from, scheduled_to,
      utm_source, utm_medium, utm_campaign, custom_css,
    } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    const { rows: maxRows } = await db.execute({
      sql: 'SELECT MAX(position) as max_position FROM links WHERE user_id = ?',
      args: [userId],
    });
    const nextPosition = ((maxRows[0]?.max_position as number) || 0) + 1;

    const linkId = uuidv4();
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO links (id, user_id, title, url, description, type, icon_url, thumbnail_url,
                          animation_type, highlight, scheduled_from, scheduled_to,
                          utm_source, utm_medium, utm_campaign, custom_css,
                          position, click_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        linkId, userId, title, url,
        description || null, type || null, icon_url || null, thumbnail_url || null,
        animation_type || null, highlight ? 1 : 0,
        scheduled_from || null, scheduled_to || null,
        utm_source || null, utm_medium || null, utm_campaign || null, custom_css || null,
        nextPosition, 0, now, now,
      ],
    });

    const { rows: newRows } = await db.execute({
      sql: `SELECT id, user_id, title, url, description, type, icon_url, thumbnail_url,
              animation_type, highlight, enabled, scheduled_from, scheduled_to,
              utm_source, utm_medium, utm_campaign, custom_css, position,
              click_count, created_at, updated_at
       FROM links WHERE id = ?`,
      args: [linkId],
    });

    return res.status(201).json(newRows[0] ?? null);
  } catch (error) {
    console.error('Create link error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
