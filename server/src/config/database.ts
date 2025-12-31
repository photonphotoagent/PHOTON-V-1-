import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/photon.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initDatabase(): void {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name TEXT NOT NULL,
      avatar TEXT,
      plan TEXT DEFAULT 'Free' CHECK(plan IN ('Free', 'Pro', 'Enterprise')),
      experience_level TEXT CHECK(experience_level IN ('Beginner', 'Enthusiast', 'Pro', 'Agency')),
      archive_size TEXT CHECK(archive_size IN ('Small', 'Medium', 'Large', 'Massive')),
      google_id TEXT UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Refresh tokens table
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Images table
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_filename TEXT,
      mime_type TEXT NOT NULL,
      file_size INTEGER,
      storage_path TEXT NOT NULL,
      preview_path TEXT,
      is_analyzed INTEGER DEFAULT 0,
      is_distributed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Analysis results table
    CREATE TABLE IF NOT EXISTS analysis_results (
      id TEXT PRIMARY KEY,
      image_id TEXT UNIQUE NOT NULL REFERENCES images(id) ON DELETE CASCADE,
      scores_json TEXT,
      monetization_json TEXT,
      curation_json TEXT,
      social_strategy_json TEXT,
      market_comparison_json TEXT,
      creative_remixes_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Platform connections table
    CREATE TABLE IF NOT EXISTS platform_connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      token_expires_at TEXT,
      account_id TEXT,
      account_name TEXT,
      is_connected INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, platform)
    );

    -- Distribution history table
    CREATE TABLE IF NOT EXISTS distribution_history (
      id TEXT PRIMARY KEY,
      image_id TEXT NOT NULL REFERENCES images(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'uploading', 'processing', 'success', 'error')),
      external_id TEXT,
      error_message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Image adjustments table
    CREATE TABLE IF NOT EXISTS image_adjustments (
      id TEXT PRIMARY KEY,
      image_id TEXT NOT NULL REFERENCES images(id) ON DELETE CASCADE,
      adjustments_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_images_user ON images(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_distribution_history_image ON distribution_history(image_id);
    CREATE INDEX IF NOT EXISTS idx_distribution_history_user ON distribution_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_platform_connections_user ON platform_connections(user_id);
  `);

  console.log('Database initialized successfully');
}

export default db;
