import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_PATH = process.env.DATABASE_PATH ||
  resolve(__dirname, '../../apps/web/data/linkflow.db');

let db: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!db) {
    // Check if database file exists
    if (!existsSync(DATABASE_PATH)) {
      throw new Error(`Database file not found at ${DATABASE_PATH}`);
    }

    db = new DatabaseSync(DATABASE_PATH);

    // Enable WAL mode for better concurrency
    db.exec('PRAGMA journal_mode = WAL');

    // Set timeout for locked database
    db.exec('PRAGMA busy_timeout = 5000');
  }

  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Type definitions for database queries
export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  avatar_url?: string;
  bio?: string;
  title?: string;
  social_links?: string; // JSON string
  theme_id?: string;
  seo_title?: string;
  seo_description?: string;
  created_at: string;
  updated_at: string;
}

export interface Link {
  id: string;
  user_id: string;
  title: string;
  url: string;
  description?: string;
  type?: string;
  icon_url?: string;
  animation_type?: string;
  highlight: boolean;
  position: number;
  scheduled_from?: string;
  scheduled_to?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  created_at: string;
  updated_at: string;
}

export interface Theme {
  id: string;
  user_id?: string; // null for builtin themes
  name: string;
  config: string; // JSON string
  is_builtin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Analytics {
  id: string;
  user_id: string;
  link_id?: string;
  event_type: string; // 'view' or 'click'
  device_type?: string;
  browser?: string;
  country?: string;
  referrer?: string;
  created_at: string;
}

export interface Subscriber {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  subscribed_at: string;
}

export interface Plugin {
  id: string;
  user_id: string;
  plugin_name: string;
  config: string; // JSON string
  installed_at: string;
}
