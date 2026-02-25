import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthTokenPayload } from '@/lib/auth';
import { getDb } from '@/lib/db';

export default withAuth(async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthTokenPayload) {
  const userId = user.userId;
  if (req.method === 'GET') {
    return handleGet(req, res, userId);
  } else if (req.method === 'PATCH') {
    return handlePatch(req, res, userId);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
});

async function handleGet(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const db = getDb();
    const profile = db.prepare(
      `SELECT id, user_id, title, bio, avatar_url, custom_logo_url, social_links,
              theme_id, seo_title, seo_description, custom_css, created_at, updated_at
       FROM profiles WHERE user_id = ?`
    ).get(userId) as any;

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    return res.status(200).json({
      ...profile,
      social_links: profile.social_links ? JSON.parse(profile.social_links as string) : null,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const db = getDb();
    const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(userId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const {
      title, bio, avatar_url, custom_logo_url, social_links,
      theme_id, seo_title, seo_description, custom_css,
    } = req.body;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    const addField = (col: string, val: any) => { updates.push(`${col} = ?`); values.push(val); };

    if (title !== undefined) addField('title', title);
    if (bio !== undefined) addField('bio', bio);
    if (avatar_url !== undefined) addField('avatar_url', avatar_url);
    if (custom_logo_url !== undefined) addField('custom_logo_url', custom_logo_url);
    if (social_links !== undefined) addField('social_links', JSON.stringify(social_links));
    if (theme_id !== undefined) addField('theme_id', theme_id);
    if (seo_title !== undefined) addField('seo_title', seo_title);
    if (seo_description !== undefined) addField('seo_description', seo_description);
    if (custom_css !== undefined) addField('custom_css', custom_css);

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    updates.push('updated_at = ?');
    values.push(now, userId);

    db.prepare(`UPDATE profiles SET ${updates.join(', ')} WHERE user_id = ?`).run(...values);

    const updated = db.prepare(
      `SELECT id, user_id, title, bio, avatar_url, custom_logo_url, social_links,
              theme_id, seo_title, seo_description, custom_css, created_at, updated_at
       FROM profiles WHERE user_id = ?`
    ).get(userId) as any;

    return res.status(200).json({
      ...updated,
      social_links: updated.social_links ? JSON.parse(updated.social_links as string) : null,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
