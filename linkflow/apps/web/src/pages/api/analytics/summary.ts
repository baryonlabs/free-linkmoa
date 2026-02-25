import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthTokenPayload } from '@/lib/auth';
import { getDb } from '@/lib/db';

type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';

export default withAuth(async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthTokenPayload) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { timeRange = '30d' } = req.query;
    if (!['24h', '7d', '30d', '90d', 'all'].includes(timeRange as string)) {
      return res.status(400).json({ error: 'Invalid time range' });
    }

    const db = getDb();
    const range = timeRange as TimeRange;
    const userId = user.userId;

    let dateFilter = '';
    if (range !== 'all') {
      const days = range === '24h' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      dateFilter = `AND ae.created_at >= '${startDate}'`;
    }

    const totals = db.prepare(
      `SELECT
        COUNT(*) as totalViews,
        SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) as totalClicks
       FROM analytics_events ae WHERE ae.user_id = ? ${dateFilter}`
    ).get(userId) as any;

    const totalViews = (totals?.totalViews as number) || 0;
    const totalClicks = (totals?.totalClicks as number) || 0;
    const clickRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00';

    const topLinks = db.prepare(
      `SELECT l.id, l.title, l.url,
        COUNT(ae.id) as views,
        SUM(CASE WHEN ae.event_type = 'click' THEN 1 ELSE 0 END) as clicks
       FROM analytics_events ae
       JOIN links l ON ae.link_id = l.id
       WHERE ae.user_id = ? ${dateFilter}
       GROUP BY l.id ORDER BY views DESC LIMIT 10`
    ).all(userId);

    const deviceBreakdown = db.prepare(
      `SELECT COALESCE(device_type, 'unknown') as device, COUNT(*) as count
       FROM analytics_events WHERE user_id = ? ${dateFilter.replace('ae.', '')}
       GROUP BY device_type ORDER BY count DESC`
    ).all(userId);

    const locationBreakdown = db.prepare(
      `SELECT COALESCE(referrer, 'direct') as location, COUNT(*) as count
       FROM analytics_events WHERE user_id = ? ${dateFilter.replace('ae.', '')}
       GROUP BY referrer ORDER BY count DESC LIMIT 10`
    ).all(userId);

    const viewsOverTime = db.prepare(
      `SELECT DATE(created_at) as date, COUNT(*) as views,
        SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) as clicks
       FROM analytics_events WHERE user_id = ? ${dateFilter.replace('ae.', '')}
       GROUP BY DATE(created_at) ORDER BY date ASC`
    ).all(userId);

    return res.status(200).json({
      timeRange: range,
      totalViews,
      totalClicks,
      clickRate: parseFloat(clickRate),
      topLinks,
      deviceBreakdown,
      locationBreakdown,
      viewsOverTime,
    });
  } catch (error) {
    console.error('Get analytics summary error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
