import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthTokenPayload } from '@/lib/auth';
import { getDb } from '@/lib/db';

export default withAuth(async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthTokenPayload) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getDb();
    const userId = user.userId;

    const userData = db.prepare(
      'SELECT id, username, email, created_at FROM users WHERE id = ?'
    ).get(userId) as any;

    if (!userData) return res.status(404).json({ error: 'User not found' });

    const profile = db.prepare(
      `SELECT id, user_id, title, bio, avatar_url, custom_logo_url, social_links,
              theme_id, seo_title, seo_description, custom_css, created_at, updated_at
       FROM profiles WHERE user_id = ?`
    ).get(userId) as any;

    const parsedProfile = profile
      ? {
          ...profile,
          social_links: profile.social_links
            ? JSON.parse(profile.social_links as string)
            : null,
        }
      : null;

    return res.status(200).json({ user: userData, profile: parsedProfile });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
