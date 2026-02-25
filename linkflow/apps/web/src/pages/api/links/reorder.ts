import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthTokenPayload } from '@/lib/auth';
import { getDb } from '@/lib/db';

export default withAuth(async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthTokenPayload) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items must be a non-empty array' });
    }

    for (const item of items) {
      if (!item.id || typeof item.id !== 'string' || typeof item.position !== 'number') {
        return res.status(400).json({ error: 'Each item must have id (string) and position (number)' });
      }
    }

    const db = getDb();
    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION');
    try {
      for (const item of items) {
        const link = db.prepare('SELECT id FROM links WHERE id = ? AND user_id = ?').get(item.id, user.userId);
        if (!link) {
          throw new Error(`Link ${item.id} not found or does not belong to user`);
        }
        db.prepare('UPDATE links SET position = ?, updated_at = ? WHERE id = ?').run(
          item.position, now, item.id
        );
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    const updatedLinks = db.prepare(
      `SELECT id, user_id, title, url, description, type, icon_url, thumbnail_url,
              animation_type, highlight, enabled, position, click_count, created_at, updated_at
       FROM links WHERE user_id = ? ORDER BY position ASC`
    ).all(user.userId);

    return res.status(200).json(updatedLinks);
  } catch (error) {
    console.error('Reorder links error:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});
