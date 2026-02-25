import { getCurrentUserId } from '../utils/auth.js';
import { getDatabase, Subscriber } from '../utils/db.js';

export const subscriberTools = [
  {
    name: 'list_subscribers',
    description: 'List all email subscribers for the user',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of subscribers to return (default: 100)',
        },
        offset: {
          type: 'number',
          description: 'Number of subscribers to skip (default: 0)',
        },
      },
      required: [],
    },
  },
  {
    name: 'export_subscribers',
    description: 'Export subscribers as CSV data',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

export function handleListSubscribers(args: Record<string, unknown>) {
  const userId = getCurrentUserId();
  const db = getDatabase();

  const limit = Math.min((args.limit as number) || 100, 1000);
  const offset = (args.offset as number) || 0;

  const subscribers = db
    .prepare(
      `SELECT * FROM subscribers
       WHERE user_id = ?
       ORDER BY subscribed_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(userId, limit, offset) as Subscriber[];

  // Get total count
  const countResult = db
    .prepare('SELECT COUNT(*) as total FROM subscribers WHERE user_id = ?')
    .get(userId) as { total: number };

  return {
    subscribers: subscribers.map((sub) => ({
      id: sub.id,
      email: sub.email,
      name: sub.name || null,
      subscribed_at: sub.subscribed_at,
    })),
    total: countResult.total,
    limit,
    offset,
  };
}

export function handleExportSubscribers() {
  const userId = getCurrentUserId();
  const db = getDatabase();

  const subscribers = db
    .prepare('SELECT email, name, subscribed_at FROM subscribers WHERE user_id = ? ORDER BY subscribed_at DESC')
    .all(userId) as Array<{ email: string; name: string | null; subscribed_at: string }>;

  // Create CSV content
  const headers = ['Email', 'Name', 'Subscribed At'];
  const rows = subscribers.map((sub) => [
    `"${sub.email}"`,
    `"${sub.name || ''}"`,
    `"${sub.subscribed_at}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return {
    csv,
    total_subscribers: subscribers.length,
    filename: `subscribers-${new Date().toISOString().split('T')[0]}.csv`,
  };
}
