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

    const db = await getDb();
    const now = new Date().toISOString();
    const userId = user.userId;

    // Verify all items belong to this user
    const placeholders = items.map(() => '?').join(', ');
    const { rows: ownedRows } = await db.execute({
      sql: `SELECT id FROM links WHERE user_id = ? AND id IN (${placeholders})`,
      args: [userId, ...items.map((i) => i.id)],
    });

    if (ownedRows.length !== items.length) {
      return res.status(404).json({ error: 'One or more links not found' });
    }

    await db.batch(
      items.map((item) => ({
        sql: 'UPDATE links SET position = ?, updated_at = ? WHERE id = ?',
        args: [item.position, now, item.id],
      })),
      'write'
    );

    const { rows: updatedLinks } = await db.execute({
      sql: `SELECT id, user_id, title, url, description, type, icon_url, thumbnail_url,
              animation_type, highlight, enabled, position, click_count, created_at, updated_at
       FROM links WHERE user_id = ? ORDER BY position ASC`,
      args: [userId],
    });

    return res.status(200).json(updatedLinks);
  } catch (error) {
    console.error('Reorder links error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
