import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { UAParser } from 'ua-parser-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, linkId, eventType, referrer, userAgent } = req.body;

    // Validate required fields
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!eventType || typeof eventType !== 'string') {
      return res.status(400).json({ error: 'Event type is required' });
    }

    const db = getDb();

    // Parse user agent
    let device = null;
    let browser = null;
    let os = null;

    if (userAgent) {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();
      device = result.device.type || 'desktop';
      browser = result.browser.name || null;
      os = result.os.name || null;
    }

    // Create analytics event
    const eventId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `
      INSERT INTO analytics_events (id, user_id, link_id, event_type, device, browser, os, referrer, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(eventId, userId, linkId || null, eventType, device, browser, os, referrer || null, now);

    // Increment link click count if this is a click event and linkId is provided
    if (eventType === 'click' && linkId) {
      db.prepare('UPDATE links SET clicks = clicks + 1 WHERE id = ?').run(linkId);
    }

    return res.status(201).json({
      id: eventId,
      userId,
      linkId: linkId || null,
      eventType,
      device,
      browser,
      os,
      referrer: referrer || null,
      created_at: now,
    });
  } catch (error) {
    console.error('Track event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
