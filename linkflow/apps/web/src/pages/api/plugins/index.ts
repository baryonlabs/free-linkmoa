import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthTokenPayload } from '@/lib/auth';
import { getDb } from '@/lib/db';

const AVAILABLE_PLUGINS = [
  {
    id: 'email-collector',
    name: 'Email Collector',
    description: 'Collect emails from your visitors with a subscribe form',
    version: '1.0.0',
    author: 'LinkFlow',
    icon: '📧',
  },
  {
    id: 'social-share',
    name: 'Social Share',
    description: 'Add social sharing buttons to your profile',
    version: '1.0.0',
    author: 'LinkFlow',
    icon: '🔗',
  },
  {
    id: 'countdown-timer',
    name: 'Countdown Timer',
    description: 'Add a countdown timer for special events',
    version: '1.0.0',
    author: 'LinkFlow',
    icon: '⏰',
  },
];

export default withAuth(async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  user: AuthTokenPayload
) {
  const db = await getDb();

  if (req.method === 'GET') {
    try {
      const { rows } = await db.execute({
        sql: 'SELECT plugin_id, enabled FROM plugin_installations WHERE user_id = ?',
        args: [user.userId],
      });
      const installed = new Set(rows.map((r: any) => r.plugin_id));

      const plugins = AVAILABLE_PLUGINS.map((p) => ({
        ...p,
        is_installed: installed.has(p.id),
      }));

      return res.status(200).json(plugins);
    } catch {
      // plugin_installations table may not exist yet
      return res.status(200).json(AVAILABLE_PLUGINS.map((p) => ({ ...p, is_installed: false })));
    }
  }

  if (req.method === 'POST') {
    const { plugin_id, enabled = true } = req.body;
    const plugin = AVAILABLE_PLUGINS.find((p) => p.id === plugin_id);
    if (!plugin) return res.status(404).json({ error: 'Plugin not found' });

    try {
      await db.execute({
        sql: `INSERT INTO plugin_installations (id, user_id, plugin_id, plugin_name, version, enabled)
              VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT(user_id, plugin_id) DO UPDATE SET enabled = excluded.enabled`,
        args: [crypto.randomUUID(), user.userId, plugin_id, plugin.name, plugin.version, enabled ? 1 : 0],
      });
      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Failed to install plugin' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
