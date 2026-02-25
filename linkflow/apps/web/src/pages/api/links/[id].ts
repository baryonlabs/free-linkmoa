import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthTokenPayload } from '@/lib/auth';
import { getDb } from '@/lib/db';

export default withAuth(async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthTokenPayload) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Link ID is required' });
  }

  if (req.method === 'GET') {
    return handleGet(req, res, user.userId, id);
  } else if (req.method === 'PATCH') {
    return handlePatch(req, res, user.userId, id);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res, user.userId, id);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});

const LINK_SELECT = `SELECT id, user_id, title, url, description, type, icon_url, thumbnail_url,
  animation_type, highlight, enabled, scheduled_from, scheduled_to,
  utm_source, utm_medium, utm_campaign, custom_css, position,
  click_count, created_at, updated_at FROM links`;

async function handleGet(req: NextApiRequest, res: NextApiResponse, userId: string, linkId: string) {
  try {
    const db = getDb();
    const link = db.prepare(`${LINK_SELECT} WHERE id = ? AND user_id = ?`).get(linkId, userId);
    if (!link) return res.status(404).json({ error: 'Link not found' });
    return res.status(200).json(link);
  } catch (error) {
    console.error('Get link error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse, userId: string, linkId: string) {
  try {
    const db = getDb();
    const link = db.prepare('SELECT id FROM links WHERE id = ? AND user_id = ?').get(linkId, userId);
    if (!link) return res.status(404).json({ error: 'Link not found' });

    const {
      title, url, description, type, icon_url, thumbnail_url,
      animation_type, highlight, enabled, scheduled_from, scheduled_to,
      utm_source, utm_medium, utm_campaign, custom_css,
    } = req.body;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    const addField = (col: string, val: any) => { updates.push(`${col} = ?`); values.push(val); };

    if (title !== undefined) addField('title', title);
    if (url !== undefined) addField('url', url);
    if (description !== undefined) addField('description', description);
    if (type !== undefined) addField('type', type);
    if (icon_url !== undefined) addField('icon_url', icon_url);
    if (thumbnail_url !== undefined) addField('thumbnail_url', thumbnail_url);
    if (animation_type !== undefined) addField('animation_type', animation_type);
    if (highlight !== undefined) addField('highlight', highlight ? 1 : 0);
    if (enabled !== undefined) addField('enabled', enabled ? 1 : 0);
    if (scheduled_from !== undefined) addField('scheduled_from', scheduled_from);
    if (scheduled_to !== undefined) addField('scheduled_to', scheduled_to);
    if (utm_source !== undefined) addField('utm_source', utm_source);
    if (utm_medium !== undefined) addField('utm_medium', utm_medium);
    if (utm_campaign !== undefined) addField('utm_campaign', utm_campaign);
    if (custom_css !== undefined) addField('custom_css', custom_css);

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    updates.push('updated_at = ?');
    values.push(now, linkId);

    db.prepare(`UPDATE links SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updatedLink = db.prepare(`${LINK_SELECT} WHERE id = ?`).get(linkId);
    return res.status(200).json(updatedLink);
  } catch (error) {
    console.error('Update link error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, userId: string, linkId: string) {
  try {
    const db = getDb();
    const link = db.prepare('SELECT id, position FROM links WHERE id = ? AND user_id = ?').get(linkId, userId) as any;
    if (!link) return res.status(404).json({ error: 'Link not found' });

    db.prepare('DELETE FROM links WHERE id = ?').run(linkId);
    db.prepare('UPDATE links SET position = position - 1 WHERE user_id = ? AND position > ?').run(
      userId, link.position as number
    );

    return res.status(204).end();
  } catch (error) {
    console.error('Delete link error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
