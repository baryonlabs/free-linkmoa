import { getCurrentUserId } from '../utils/auth.js';
import { getDatabase, Analytics, Link } from '../utils/db.js';

export const analyticsTools = [
  {
    name: 'get_analytics',
    description: 'Get analytics summary for the user profile',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to look back (default: 30)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_link_analytics',
    description: 'Get analytics for a specific link',
    inputSchema: {
      type: 'object',
      properties: {
        link_id: {
          type: 'string',
          description: 'Link ID',
        },
        days: {
          type: 'number',
          description: 'Number of days to look back (default: 30)',
        },
      },
      required: ['link_id'],
    },
  },
];

export function handleGetAnalytics(args: Record<string, unknown>) {
  const userId = getCurrentUserId();
  const db = getDatabase();

  const days = (args.days as number) || 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  // Get total views
  const viewStats = db
    .prepare(
      `SELECT COUNT(*) as total_views
       FROM analytics
       WHERE event_type = 'view' AND user_id = ? AND created_at >= ?`
    )
    .get(userId, fromDate.toISOString()) as { total_views: number };

  // Get total clicks
  const clickStats = db
    .prepare(
      `SELECT COUNT(*) as total_clicks
       FROM analytics
       WHERE event_type = 'click' AND user_id = ? AND created_at >= ?`
    )
    .get(userId, fromDate.toISOString()) as { total_clicks: number };

  // Get top links by clicks
  const topLinks = db
    .prepare(
      `SELECT link_id, COUNT(*) as click_count
       FROM analytics
       WHERE event_type = 'click' AND user_id = ? AND created_at >= ?
       GROUP BY link_id
       ORDER BY click_count DESC
       LIMIT 10`
    )
    .all(userId, fromDate.toISOString()) as Array<{ link_id: string | null; click_count: number }>;

  // Get device breakdown
  const deviceStats = db
    .prepare(
      `SELECT device_type, COUNT(*) as count
       FROM analytics
       WHERE user_id = ? AND created_at >= ?
       GROUP BY device_type`
    )
    .all(userId, fromDate.toISOString()) as Array<{ device_type: string | null; count: number }>;

  // Get top countries
  const countryStats = db
    .prepare(
      `SELECT country, COUNT(*) as count
       FROM analytics
       WHERE user_id = ? AND created_at >= ?
       GROUP BY country
       ORDER BY count DESC
       LIMIT 10`
    )
    .all(userId, fromDate.toISOString()) as Array<{ country: string | null; count: number }>;

  // Get top browsers
  const browserStats = db
    .prepare(
      `SELECT browser, COUNT(*) as count
       FROM analytics
       WHERE user_id = ? AND created_at >= ?
       GROUP BY browser
       ORDER BY count DESC
       LIMIT 5`
    )
    .all(userId, fromDate.toISOString()) as Array<{ browser: string | null; count: number }>;

  // Get top links with link details
  const topLinksWithDetails = topLinks.map((item) => {
    if (item.link_id) {
      const link = db
        .prepare('SELECT id, title, url FROM links WHERE id = ?')
        .get(item.link_id) as Pick<Link, 'id' | 'title' | 'url'> | undefined;

      return {
        link_id: item.link_id,
        title: link?.title || 'Unknown',
        url: link?.url || '',
        clicks: item.click_count,
      };
    }
    return null;
  }).filter(Boolean);

  return {
    period_days: days,
    total_views: viewStats.total_views,
    total_clicks: clickStats.total_clicks,
    top_links: topLinksWithDetails,
    device_breakdown: deviceStats.map((d) => ({
      device_type: d.device_type || 'unknown',
      count: d.count,
    })),
    top_countries: countryStats.map((c) => ({
      country: c.country || 'unknown',
      count: c.count,
    })),
    top_browsers: browserStats.map((b) => ({
      browser: b.browser || 'unknown',
      count: b.count,
    })),
  };
}

export function handleGetLinkAnalytics(args: Record<string, unknown>) {
  const userId = getCurrentUserId();
  const db = getDatabase();

  if (!args.link_id) {
    throw new Error('link_id is required');
  }

  // Verify link belongs to user
  const link = db
    .prepare('SELECT * FROM links WHERE id = ? AND user_id = ?')
    .get(args.link_id, userId) as Link | undefined;

  if (!link) {
    throw new Error('Link not found');
  }

  const days = (args.days as number) || 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  // Get analytics for this link
  const analytics = db
    .prepare(
      `SELECT * FROM analytics
       WHERE link_id = ? AND user_id = ? AND created_at >= ?
       ORDER BY created_at DESC`
    )
    .all(args.link_id, userId, fromDate.toISOString()) as Analytics[];

  // Get summary stats
  const clickCount = analytics.filter((a) => a.event_type === 'click').length;
  const viewCount = analytics.filter((a) => a.event_type === 'view').length;

  // Get device breakdown
  const deviceBreakdown = new Map<string, number>();
  analytics.forEach((a) => {
    const device = a.device_type || 'unknown';
    deviceBreakdown.set(device, (deviceBreakdown.get(device) || 0) + 1);
  });

  // Get geographic breakdown
  const countries = new Map<string, number>();
  analytics.forEach((a) => {
    const country = a.country || 'unknown';
    countries.set(country, (countries.get(country) || 0) + 1);
  });

  // Get browser breakdown
  const browsers = new Map<string, number>();
  analytics.forEach((a) => {
    const browser = a.browser || 'unknown';
    browsers.set(browser, (browsers.get(browser) || 0) + 1);
  });

  return {
    link_id: args.link_id,
    link_title: link.title,
    link_url: link.url,
    period_days: days,
    total_clicks: clickCount,
    total_views: viewCount,
    device_breakdown: Array.from(deviceBreakdown, ([device, count]) => ({
      device,
      count,
    })),
    countries: Array.from(countries, ([country, count]) => ({
      country,
      count,
    })),
    browsers: Array.from(browsers, ([browser, count]) => ({
      browser,
      count,
    })),
    recent_events: analytics.slice(0, 20).map((a) => ({
      event_type: a.event_type,
      device_type: a.device_type,
      country: a.country,
      browser: a.browser,
      created_at: a.created_at,
    })),
  };
}
