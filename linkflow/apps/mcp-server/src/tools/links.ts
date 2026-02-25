import { randomUUID } from 'crypto';
import { getCurrentUserId } from '../utils/auth.js';
import { getDatabase, Link } from '../utils/db.js';

export const linkTools = [
  {
    name: 'list_links',
    description: 'List all links for the current user, ordered by position',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_link',
    description: 'Create a new link',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Link title',
        },
        url: {
          type: 'string',
          description: 'Link URL',
        },
        description: {
          type: 'string',
          description: 'Link description',
        },
        type: {
          type: 'string',
          description: 'Link type (e.g., website, social, store)',
        },
        icon_url: {
          type: 'string',
          description: 'URL to link icon',
        },
        animation_type: {
          type: 'string',
          description: 'Animation type for the link',
        },
        highlight: {
          type: 'boolean',
          description: 'Whether to highlight this link',
        },
        scheduled_from: {
          type: 'string',
          description: 'Schedule start date (ISO format)',
        },
        scheduled_to: {
          type: 'string',
          description: 'Schedule end date (ISO format)',
        },
        utm_source: {
          type: 'string',
          description: 'UTM source parameter',
        },
        utm_medium: {
          type: 'string',
          description: 'UTM medium parameter',
        },
        utm_campaign: {
          type: 'string',
          description: 'UTM campaign parameter',
        },
      },
      required: ['title', 'url'],
    },
  },
  {
    name: 'update_link',
    description: 'Update an existing link',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Link ID',
        },
        title: {
          type: 'string',
          description: 'Link title',
        },
        url: {
          type: 'string',
          description: 'Link URL',
        },
        description: {
          type: 'string',
          description: 'Link description',
        },
        type: {
          type: 'string',
          description: 'Link type',
        },
        icon_url: {
          type: 'string',
          description: 'URL to link icon',
        },
        animation_type: {
          type: 'string',
          description: 'Animation type',
        },
        highlight: {
          type: 'boolean',
          description: 'Whether to highlight this link',
        },
        scheduled_from: {
          type: 'string',
          description: 'Schedule start date',
        },
        scheduled_to: {
          type: 'string',
          description: 'Schedule end date',
        },
        utm_source: {
          type: 'string',
          description: 'UTM source parameter',
        },
        utm_medium: {
          type: 'string',
          description: 'UTM medium parameter',
        },
        utm_campaign: {
          type: 'string',
          description: 'UTM campaign parameter',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_link',
    description: 'Delete a link by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Link ID to delete',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'reorder_links',
    description: 'Reorder links by updating their positions',
    inputSchema: {
      type: 'object',
      properties: {
        links: {
          type: 'array',
          description: 'Array of {id, position} objects',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              position: {
                type: 'number',
              },
            },
            required: ['id', 'position'],
          },
        },
      },
      required: ['links'],
    },
  },
];

export function handleListLinks() {
  const userId = getCurrentUserId();
  const db = getDatabase();

  const links = db
    .prepare(
      `SELECT * FROM links WHERE user_id = ? ORDER BY position ASC`
    )
    .all(userId) as Link[];

  return links;
}

export function handleCreateLink(args: Record<string, unknown>) {
  const userId = getCurrentUserId();
  const db = getDatabase();

  if (!args.title || !args.url) {
    throw new Error('title and url are required');
  }

  const id = randomUUID();

  // Get the highest position and add 1
  const maxPosition = (db
    .prepare(`SELECT MAX(position) as max_pos FROM links WHERE user_id = ?`)
    .get(userId) as { max_pos: number | null }) || { max_pos: null };

  const position = (maxPosition.max_pos || 0) + 1;

  const stmt = db.prepare(
    `INSERT INTO links (
      id, user_id, title, url, description, type, icon_url,
      animation_type, highlight, position, scheduled_from, scheduled_to,
      utm_source, utm_medium, utm_campaign, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );

  stmt.run(
    id,
    userId,
    args.title,
    args.url,
    args.description || null,
    args.type || null,
    args.icon_url || null,
    args.animation_type || null,
    args.highlight ? 1 : 0,
    position,
    args.scheduled_from || null,
    args.scheduled_to || null,
    args.utm_source || null,
    args.utm_medium || null,
    args.utm_campaign || null
  );

  const link = db.prepare('SELECT * FROM links WHERE id = ?').get(id) as Link;
  return link;
}

export function handleUpdateLink(args: Record<string, unknown>) {
  const userId = getCurrentUserId();
  const db = getDatabase();

  if (!args.id) {
    throw new Error('id is required');
  }

  // Verify link belongs to user
  const link = db
    .prepare('SELECT * FROM links WHERE id = ? AND user_id = ?')
    .get(args.id, userId) as Link | undefined;

  if (!link) {
    throw new Error('Link not found');
  }

  const updates: string[] = [];
  const params: unknown[] = [];

  if (args.title !== undefined) {
    updates.push('title = ?');
    params.push(args.title);
  }
  if (args.url !== undefined) {
    updates.push('url = ?');
    params.push(args.url);
  }
  if (args.description !== undefined) {
    updates.push('description = ?');
    params.push(args.description);
  }
  if (args.type !== undefined) {
    updates.push('type = ?');
    params.push(args.type);
  }
  if (args.icon_url !== undefined) {
    updates.push('icon_url = ?');
    params.push(args.icon_url);
  }
  if (args.animation_type !== undefined) {
    updates.push('animation_type = ?');
    params.push(args.animation_type);
  }
  if (args.highlight !== undefined) {
    updates.push('highlight = ?');
    params.push(args.highlight ? 1 : 0);
  }
  if (args.scheduled_from !== undefined) {
    updates.push('scheduled_from = ?');
    params.push(args.scheduled_from);
  }
  if (args.scheduled_to !== undefined) {
    updates.push('scheduled_to = ?');
    params.push(args.scheduled_to);
  }
  if (args.utm_source !== undefined) {
    updates.push('utm_source = ?');
    params.push(args.utm_source);
  }
  if (args.utm_medium !== undefined) {
    updates.push('utm_medium = ?');
    params.push(args.utm_medium);
  }
  if (args.utm_campaign !== undefined) {
    updates.push('utm_campaign = ?');
    params.push(args.utm_campaign);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(args.id);

  const stmt = db.prepare(
    `UPDATE links SET ${updates.join(', ')} WHERE id = ?`
  );
  const result = stmt.run(...params);

  if (result.changes === 0) {
    throw new Error('Failed to update link');
  }

  const updated = db.prepare('SELECT * FROM links WHERE id = ?').get(args.id) as Link;
  return updated;
}

export function handleDeleteLink(args: Record<string, unknown>) {
  const userId = getCurrentUserId();
  const db = getDatabase();

  if (!args.id) {
    throw new Error('id is required');
  }

  // Verify link belongs to user
  const link = db
    .prepare('SELECT * FROM links WHERE id = ? AND user_id = ?')
    .get(args.id, userId) as Link | undefined;

  if (!link) {
    throw new Error('Link not found');
  }

  const stmt = db.prepare('DELETE FROM links WHERE id = ?');
  const result = stmt.run(args.id);

  if (result.changes === 0) {
    throw new Error('Failed to delete link');
  }

  return { success: true, message: 'Link deleted successfully' };
}

export function handleReorderLinks(args: Record<string, unknown>) {
  const userId = getCurrentUserId();
  const db = getDatabase();

  if (!Array.isArray(args.links)) {
    throw new Error('links must be an array');
  }

  const transaction = db.transaction(() => {
    for (const item of args.links as Array<{ id: string; position: number }>) {
      if (!item.id || item.position === undefined) {
        throw new Error('Each link must have id and position');
      }

      // Verify link belongs to user
      const link = db
        .prepare('SELECT * FROM links WHERE id = ? AND user_id = ?')
        .get(item.id, userId);

      if (!link) {
        throw new Error(`Link ${item.id} not found`);
      }

      db.prepare('UPDATE links SET position = ? WHERE id = ?').run(
        item.position,
        item.id
      );
    }
  });

  transaction();

  return {
    success: true,
    message: 'Links reordered successfully',
  };
}
