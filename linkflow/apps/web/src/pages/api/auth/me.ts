import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthTokenPayload } from '@/lib/auth';
import { getDb } from '@/lib/db';

export default withAuth(async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthTokenPayload) {
  if (req.method === 'PATCH') {
    return handlePatch(req, res, user.userId);
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getDb();
    const userId = user.userId;

    const { rows: userRows } = await db.execute({
      sql: 'SELECT id, username, email, created_at FROM users WHERE id = ?',
      args: [userId],
    });
    const userData = userRows[0] as any;
    if (!userData) return res.status(404).json({ error: 'User not found' });

    const { rows: profileRows } = await db.execute({
      sql: `SELECT id, user_id, title, bio, avatar_url, custom_logo_url, social_links,
              theme_id, seo_title, seo_description, custom_css, created_at, updated_at
       FROM profiles WHERE user_id = ?`,
      args: [userId],
    });
    const profile = profileRows[0] as any;

    const parsedProfile = profile
      ? { ...profile, social_links: profile.social_links ? JSON.parse(profile.social_links as string) : null }
      : null;

    return res.status(200).json({ user: userData, profile: parsedProfile });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

async function handlePatch(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'username is required' });
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      return res.status(400).json({ error: 'username must be 3-30 chars (letters, numbers, _, -)' });
    }

    const db = await getDb();
    const { rows: existing } = await db.execute({
      sql: 'SELECT id FROM users WHERE username = ? AND id != ?',
      args: [username, userId],
    });
    if (existing.length > 0) return res.status(409).json({ error: 'Username already taken' });

    await db.execute({
      sql: 'UPDATE users SET username = ? WHERE id = ?',
      args: [username, userId],
    });
    return res.status(200).json({ username });
  } catch (error) {
    console.error('Update username error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
