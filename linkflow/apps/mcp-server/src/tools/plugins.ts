import { randomUUID } from 'crypto';
import { getCurrentUserId } from '../utils/auth.js';
import { getDatabase, Plugin } from '../utils/db.js';

export const pluginTools = [
  {
    name: 'list_plugins',
    description: 'List all installed plugins for the user',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'install_plugin',
    description: 'Install a plugin',
    inputSchema: {
      type: 'object',
      properties: {
        plugin_name: {
          type: 'string',
          description: 'Name of the plugin to install',
        },
        config: {
          type: 'object',
          description: 'Plugin configuration object',
        },
      },
      required: ['plugin_name'],
    },
  },
  {
    name: 'uninstall_plugin',
    description: 'Uninstall a plugin',
    inputSchema: {
      type: 'object',
      properties: {
        plugin_id: {
          type: 'string',
          description: 'Plugin ID to uninstall',
        },
      },
      required: ['plugin_id'],
    },
  },
  {
    name: 'configure_plugin',
    description: 'Update plugin configuration',
    inputSchema: {
      type: 'object',
      properties: {
        plugin_id: {
          type: 'string',
          description: 'Plugin ID to configure',
        },
        config: {
          type: 'object',
          description: 'New plugin configuration',
        },
      },
      required: ['plugin_id', 'config'],
    },
  },
];

export function handleListPlugins() {
  const userId = getCurrentUserId();
  const db = getDatabase();

  const plugins = db
    .prepare('SELECT * FROM plugins WHERE user_id = ? ORDER BY installed_at DESC')
    .all(userId) as Plugin[];

  return plugins.map((plugin) => ({
    id: plugin.id,
    plugin_name: plugin.plugin_name,
    config: typeof plugin.config === 'string' ? JSON.parse(plugin.config) : plugin.config,
    installed_at: plugin.installed_at,
  }));
}

export function handleInstallPlugin(args: Record<string, unknown>) {
  const userId = getCurrentUserId();
  const db = getDatabase();

  if (!args.plugin_name) {
    throw new Error('plugin_name is required');
  }

  // Check if plugin is already installed
  const existing = db
    .prepare('SELECT * FROM plugins WHERE user_id = ? AND plugin_name = ?')
    .get(userId, args.plugin_name) as Plugin | undefined;

  if (existing) {
    throw new Error(`Plugin "${args.plugin_name}" is already installed`);
  }

  const id = randomUUID();
  const configStr = args.config
    ? typeof args.config === 'string'
      ? args.config
      : JSON.stringify(args.config)
    : '{}';

  const stmt = db.prepare(
    `INSERT INTO plugins (id, user_id, plugin_name, config, installed_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
  );

  stmt.run(id, userId, args.plugin_name, configStr);

  const plugin = db.prepare('SELECT * FROM plugins WHERE id = ?').get(id) as Plugin;

  return {
    id: plugin.id,
    plugin_name: plugin.plugin_name,
    config: JSON.parse(plugin.config),
    installed_at: plugin.installed_at,
    message: `Plugin "${args.plugin_name}" installed successfully`,
  };
}

export function handleUninstallPlugin(args: Record<string, unknown>) {
  const userId = getCurrentUserId();
  const db = getDatabase();

  if (!args.plugin_id) {
    throw new Error('plugin_id is required');
  }

  // Verify plugin belongs to user
  const plugin = db
    .prepare('SELECT * FROM plugins WHERE id = ? AND user_id = ?')
    .get(args.plugin_id, userId) as Plugin | undefined;

  if (!plugin) {
    throw new Error('Plugin not found');
  }

  const stmt = db.prepare('DELETE FROM plugins WHERE id = ?');
  const result = stmt.run(args.plugin_id);

  if (result.changes === 0) {
    throw new Error('Failed to uninstall plugin');
  }

  return {
    success: true,
    message: `Plugin "${plugin.plugin_name}" uninstalled successfully`,
  };
}

export function handleConfigurePlugin(args: Record<string, unknown>) {
  const userId = getCurrentUserId();
  const db = getDatabase();

  if (!args.plugin_id || !args.config) {
    throw new Error('plugin_id and config are required');
  }

  // Verify plugin belongs to user
  const plugin = db
    .prepare('SELECT * FROM plugins WHERE id = ? AND user_id = ?')
    .get(args.plugin_id, userId) as Plugin | undefined;

  if (!plugin) {
    throw new Error('Plugin not found');
  }

  const configStr = typeof args.config === 'string'
    ? args.config
    : JSON.stringify(args.config);

  const stmt = db.prepare('UPDATE plugins SET config = ? WHERE id = ?');
  const result = stmt.run(configStr, args.plugin_id);

  if (result.changes === 0) {
    throw new Error('Failed to configure plugin');
  }

  const updated = db.prepare('SELECT * FROM plugins WHERE id = ?').get(args.plugin_id) as Plugin;

  return {
    id: updated.id,
    plugin_name: updated.plugin_name,
    config: JSON.parse(updated.config),
    message: 'Plugin configured successfully',
  };
}
