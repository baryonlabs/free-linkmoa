import { randomUUID } from 'crypto';
import { getCurrentUserId } from '../utils/auth.js';
import { getDatabase, Theme } from '../utils/db.js';

export const themeTools = [
  {
    name: 'list_themes',
    description: 'List all available themes (builtin and custom)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'apply_theme',
    description: 'Apply a theme to the current user profile',
    inputSchema: {
      type: 'object',
      properties: {
        theme_id: {
          type: 'string',
          description: 'Theme ID to apply',
        },
      },
      required: ['theme_id'],
    },
  },
  {
    name: 'create_theme',
    description: 'Create a custom theme',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Theme name',
        },
        config: {
          type: 'object',
          description: 'Theme configuration object',
        },
      },
      required: ['name', 'config'],
    },
  },
  {
    name: 'update_theme',
    description: 'Update an existing custom theme',
    inputSchema: {
      type: 'object',
      properties: {
        theme_id: {
          type: 'string',
          description: 'Theme ID to update',
        },
        name: {
          type: 'string',
          description: 'New theme name',
        },
        config: {
          type: 'object',
          description: 'New theme configuration',
        },
      },
      required: ['theme_id'],
    },
  },
];

export function handleListThemes() {
  const userId = getCurrentUserId();
  const db = getDatabase();

  // Get builtin themes
  const builtinThemes = db
    .prepare('SELECT * FROM themes WHERE is_builtin = 1')
    .all() as Theme[];

  // Get custom themes for user
  const customThemes = db
    .prepare('SELECT * FROM themes WHERE user_id = ? AND is_builtin = 0')
    .all(userId) as Theme[];

  const allThemes = [...builtinThemes, ...customThemes].map((theme) => ({
    id: theme.id,
    name: theme.name,
    is_builtin: theme.is_builtin,
    config: typeof theme.config === 'string' ? JSON.parse(theme.config) : theme.config,
    created_at: theme.created_at,
    updated_at: theme.updated_at,
  }));

  return allThemes;
}

export function handleApplyTheme(args: Record<string, unknown>) {
  const userId = getCurrentUserId();
  const db = getDatabase();

  if (!args.theme_id) {
    throw new Error('theme_id is required');
  }

  // Verify theme exists and is either builtin or belongs to user
  const theme = db
    .prepare(
      'SELECT * FROM themes WHERE id = ? AND (is_builtin = 1 OR user_id = ?)'
    )
    .get(args.theme_id, userId) as Theme | undefined;

  if (!theme) {
    throw new Error('Theme not found');
  }

  // Update user profile with theme_id
  const stmt = db.prepare(
    'UPDATE users SET theme_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  );
  const result = stmt.run(args.theme_id, userId);

  if (result.changes === 0) {
    throw new Error('Failed to apply theme');
  }

  return {
    success: true,
    message: `Theme "${theme.name}" applied successfully`,
    theme_id: args.theme_id,
  };
}

export function handleCreateTheme(args: Record<string, unknown>) {
  const userId = getCurrentUserId();
  const db = getDatabase();

  if (!args.name || !args.config) {
    throw new Error('name and config are required');
  }

  const id = randomUUID();
  const configStr = typeof args.config === 'string'
    ? args.config
    : JSON.stringify(args.config);

  const stmt = db.prepare(
    `INSERT INTO themes (id, user_id, name, config, is_builtin, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );

  stmt.run(id, userId, args.name, configStr);

  const newTheme = db.prepare('SELECT * FROM themes WHERE id = ?').get(id) as Theme;

  return {
    id: newTheme.id,
    name: newTheme.name,
    is_builtin: newTheme.is_builtin,
    config: JSON.parse(newTheme.config),
    created_at: newTheme.created_at,
  };
}

export function handleUpdateTheme(args: Record<string, unknown>) {
  const userId = getCurrentUserId();
  const db = getDatabase();

  if (!args.theme_id) {
    throw new Error('theme_id is required');
  }

  // Verify theme belongs to user and is not builtin
  const theme = db
    .prepare('SELECT * FROM themes WHERE id = ? AND user_id = ? AND is_builtin = 0')
    .get(args.theme_id, userId) as Theme | undefined;

  if (!theme) {
    throw new Error('Custom theme not found or cannot modify builtin theme');
  }

  const updates: string[] = [];
  const params: unknown[] = [];

  if (args.name !== undefined) {
    updates.push('name = ?');
    params.push(args.name);
  }

  if (args.config !== undefined) {
    updates.push('config = ?');
    const configStr = typeof args.config === 'string'
      ? args.config
      : JSON.stringify(args.config);
    params.push(configStr);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(args.theme_id);

  const stmt = db.prepare(
    `UPDATE themes SET ${updates.join(', ')} WHERE id = ?`
  );
  const result = stmt.run(...params);

  if (result.changes === 0) {
    throw new Error('Failed to update theme');
  }

  const updated = db.prepare('SELECT * FROM themes WHERE id = ?').get(args.theme_id) as Theme;

  return {
    id: updated.id,
    name: updated.name,
    is_builtin: updated.is_builtin,
    config: JSON.parse(updated.config),
    updated_at: updated.updated_at,
  };
}
