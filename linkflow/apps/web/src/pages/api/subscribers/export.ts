import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthTokenPayload } from '@/lib/auth';
import { getDb } from '@/lib/db';

export default withAuth(async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthTokenPayload) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getDb();
    const subscribers = db.prepare(
      `SELECT id, email, subscribed_at FROM subscribers
       WHERE user_id = ? ORDER BY subscribed_at ASC`
    ).all(user.userId) as any[];

    if (subscribers.length === 0) {
      return res.status(400).json({ error: 'No subscribers to export' });
    }

    let csv = 'Email,Subscribed At\n';
    for (const sub of subscribers) {
      const email = (sub.email as string).replace(/"/g, '""');
      csv += `"${email}","${sub.subscribed_at}"\n`;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="subscribers-${timestamp}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Export subscribers error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
