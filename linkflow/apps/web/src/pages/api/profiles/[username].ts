import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.query as { username: string };

  try {
    const db = await getDb();

    // 1. 유저 조회
    const { rows: userRows } = await db.execute({
      sql: 'SELECT id, username, email FROM users WHERE username = ?',
      args: [username],
    });
    const user = userRows[0] as any;
    if (!user) {
      return res.status(404).json({ error: `User '${username}' not found` });
    }

    // 2. 프로필 조회
    const { rows: profileRows } = await db.execute({
      sql: `SELECT id, title, bio, avatar_url, social_links, theme_id, custom_css
            FROM profiles WHERE user_id = ?`,
      args: [user.id],
    });
    const profile = profileRows[0] as any;

    // 3. 활성화된 링크 조회
    const { rows: linkRows } = await db.execute({
      sql: `SELECT id, title, url, description, type, animation_type,
                   highlight, enabled, scheduled_from, scheduled_to
            FROM links
            WHERE user_id = ? AND enabled = 1
            ORDER BY position ASC`,
      args: [user.id],
    });

    // 4. 총 조회수 집계
    const { rows: viewRows } = await db.execute({
      sql: `SELECT COUNT(*) as total FROM analytics_events
            WHERE user_id = ? AND event_type = 'pageview'`,
      args: [user.id],
    });
    const totalViews = Number((viewRows[0] as any)?.total ?? 0);

    // 5. 프로필 없으면 기본값
    const socialLinks = profile?.social_links
      ? JSON.parse(profile.social_links as string)
      : null;

    return res.status(200).json({
      id: user.id,
      username: user.username,
      title: profile?.title || user.username,
      bio: profile?.bio || null,
      avatar: profile?.avatar_url || null,
      total_views: totalViews,
      email_subscription_enabled: false,
      social_icons: Array.isArray(socialLinks) ? socialLinks : [],
      theme: null,
      links: linkRows.map((l: any) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        description: l.description || null,
        type: l.type || 'link',
        animation_type: l.animation_type || null,
        is_highlighted: Boolean(l.highlight),
        is_scheduled: Boolean(l.scheduled_from && l.scheduled_to),
        scheduled_start: l.scheduled_from || null,
        scheduled_end: l.scheduled_to || null,
        enabled: Boolean(l.enabled),
      })),
    });
  } catch (error) {
    console.error('Public profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
