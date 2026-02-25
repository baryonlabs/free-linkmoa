import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'linkflow.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      avatar_url TEXT,
      title TEXT,
      bio TEXT,
      custom_logo_url TEXT,
      social_links TEXT DEFAULT '{}',
      theme_id TEXT,
      seo_title TEXT,
      seo_description TEXT,
      custom_css TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      url TEXT NOT NULL DEFAULT '',
      description TEXT,
      icon_url TEXT,
      thumbnail_url TEXT,
      type TEXT DEFAULT 'standard',
      position INTEGER DEFAULT 0,
      enabled INTEGER DEFAULT 1,
      scheduled_from DATETIME,
      scheduled_to DATETIME,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      custom_css TEXT,
      animation_type TEXT DEFAULT 'none',
      highlight INTEGER DEFAULT 0,
      click_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS themes (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'custom',
      config TEXT NOT NULL,
      preview_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      link_id TEXT REFERENCES links(id) ON DELETE SET NULL,
      event_type TEXT NOT NULL,
      referrer TEXT,
      user_agent TEXT,
      country TEXT,
      city TEXT,
      device_type TEXT,
      browser TEXT,
      os TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      name TEXT,
      metadata TEXT DEFAULT '{}',
      subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, email)
    );

    CREATE TABLE IF NOT EXISTS plugin_installations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plugin_id TEXT NOT NULL,
      plugin_name TEXT NOT NULL,
      version TEXT NOT NULL,
      config TEXT DEFAULT '{}',
      enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, plugin_id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      action TEXT NOT NULL,
      changes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
    CREATE INDEX IF NOT EXISTS idx_links_position ON links(user_id, position);
    CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_link_id ON analytics_events(link_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(user_id, event_type);
    CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);
  `);

  // Seed built-in themes if none exist
  const themeCount = db.prepare('SELECT COUNT(*) as count FROM themes WHERE type = ?').get('builtin') as { count: number };
  if (themeCount.count === 0) {
    seedBuiltinThemes(db);
  }
}

function seedBuiltinThemes(db: DatabaseSync) {
  const themes = [
    {
      id: uuid(), name: 'Minimal Light', config: {
        colors: { background: '#ffffff', text: '#1a1a1a', textSecondary: '#6b7280', buttonBg: '#1a1a1a', buttonText: '#ffffff', buttonHover: '#333333', accent: '#3b82f6', border: '#e5e7eb' },
        typography: { fontFamily: 'system-ui, -apple-system, sans-serif', titleSize: '1.5rem', bodySize: '1rem', buttonSize: '1rem' },
        layout: { maxWidth: '680px', padding: '2rem', gap: '0.75rem', borderRadius: '12px' },
        button: { style: 'solid', shadow: false, fullWidth: true },
        link: { style: 'card', showThumbnail: true, showDescription: true, showIcon: true }
      }
    },
    {
      id: uuid(), name: 'Dark Mode', config: {
        colors: { background: '#0f172a', text: '#f8fafc', textSecondary: '#94a3b8', buttonBg: '#1e293b', buttonText: '#f8fafc', buttonHover: '#334155', accent: '#6366f1', border: '#334155' },
        typography: { fontFamily: 'system-ui, -apple-system, sans-serif', titleSize: '1.5rem', bodySize: '1rem', buttonSize: '1rem' },
        layout: { maxWidth: '680px', padding: '2rem', gap: '0.75rem', borderRadius: '12px' },
        button: { style: 'solid', shadow: true, fullWidth: true },
        link: { style: 'card', showThumbnail: true, showDescription: true, showIcon: true }
      }
    },
    {
      id: uuid(), name: 'Vibrant', config: {
        colors: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#ffffff', textSecondary: '#e2e8f0', buttonBg: 'rgba(255,255,255,0.2)', buttonText: '#ffffff', buttonHover: 'rgba(255,255,255,0.3)', accent: '#fbbf24', border: 'rgba(255,255,255,0.2)' },
        typography: { fontFamily: "'Inter', system-ui, sans-serif", titleSize: '1.75rem', bodySize: '1rem', buttonSize: '1.05rem' },
        layout: { maxWidth: '680px', padding: '2rem', gap: '0.875rem', borderRadius: '16px' },
        button: { style: 'ghost', shadow: false, fullWidth: true },
        link: { style: 'card', showThumbnail: true, showDescription: true, showIcon: true }
      }
    },
    {
      id: uuid(), name: 'Glassmorphism', config: {
        colors: { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', text: '#ffffff', textSecondary: '#cbd5e1', buttonBg: 'rgba(255,255,255,0.1)', buttonText: '#ffffff', buttonHover: 'rgba(255,255,255,0.2)', accent: '#e94560', border: 'rgba(255,255,255,0.15)' },
        typography: { fontFamily: "'Inter', system-ui, sans-serif", titleSize: '1.5rem', bodySize: '1rem', buttonSize: '1rem' },
        layout: { maxWidth: '680px', padding: '2rem', gap: '0.75rem', borderRadius: '16px' },
        button: { style: 'ghost', shadow: true, fullWidth: true },
        link: { style: 'card', showThumbnail: true, showDescription: true, showIcon: true },
        advanced: { enableBlur: true }
      }
    },
    {
      id: uuid(), name: 'Cyberpunk', config: {
        colors: { background: '#0a0a0a', text: '#00ff41', textSecondary: '#00cc33', buttonBg: 'transparent', buttonText: '#00ff41', buttonHover: 'rgba(0,255,65,0.1)', accent: '#ff00ff', border: '#00ff41' },
        typography: { fontFamily: "'JetBrains Mono', 'Fira Code', monospace", titleSize: '1.5rem', bodySize: '0.95rem', buttonSize: '0.95rem' },
        layout: { maxWidth: '680px', padding: '2rem', gap: '0.75rem', borderRadius: '4px' },
        button: { style: 'outline', shadow: false, fullWidth: true },
        link: { style: 'minimal', showThumbnail: false, showDescription: true, showIcon: true }
      }
    },
    {
      id: uuid(), name: 'Sunset', config: {
        colors: { background: 'linear-gradient(180deg, #ff6b6b 0%, #ee5a24 30%, #f9ca24 100%)', text: '#ffffff', textSecondary: '#fff5ee', buttonBg: 'rgba(255,255,255,0.25)', buttonText: '#ffffff', buttonHover: 'rgba(255,255,255,0.4)', accent: '#ffffff', border: 'rgba(255,255,255,0.3)' },
        typography: { fontFamily: "'Poppins', system-ui, sans-serif", titleSize: '1.75rem', bodySize: '1rem', buttonSize: '1.05rem' },
        layout: { maxWidth: '680px', padding: '2rem', gap: '0.875rem', borderRadius: '24px' },
        button: { style: 'rounded', shadow: true, fullWidth: true },
        link: { style: 'card', showThumbnail: true, showDescription: true, showIcon: true }
      }
    }
  ];

  const stmt = db.prepare('INSERT INTO themes (id, user_id, name, type, config) VALUES (?, NULL, ?, ?, ?)');
  for (const theme of themes) {
    stmt.run(theme.id, theme.name, 'builtin', JSON.stringify(theme.config));
  }
}

export default getDb;
