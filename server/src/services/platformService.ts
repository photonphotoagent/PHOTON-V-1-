import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { PlatformConnection, DistributionRecord, PlatformName } from '../types/index.js';

// Supported platforms configuration
export const SUPPORTED_PLATFORMS: { name: PlatformName; category: 'Stock' | 'Print' | 'Social' }[] = [
  { name: 'Adobe Stock', category: 'Stock' },
  { name: 'Getty Images', category: 'Stock' },
  { name: 'Shutterstock', category: 'Stock' },
  { name: 'Alamy', category: 'Stock' },
  { name: '500px', category: 'Stock' },
  { name: 'Etsy', category: 'Print' },
  { name: 'Redbubble', category: 'Print' },
  { name: 'Society6', category: 'Print' },
  { name: 'Fine Art America', category: 'Print' },
  { name: 'Instagram', category: 'Social' },
  { name: 'Pinterest', category: 'Social' },
  { name: 'TikTok', category: 'Social' },
  { name: 'X (Twitter)', category: 'Social' },
  { name: 'Facebook', category: 'Social' },
];

export function getPlatformConnections(userId: string): PlatformConnection[] {
  const stmt = db.prepare('SELECT * FROM platform_connections WHERE user_id = ?');
  const rows = stmt.all(userId) as (PlatformConnection & { is_connected: number })[];
  return rows.map((row) => ({
    ...row,
    is_connected: Boolean(row.is_connected),
  }));
}

export function getPlatformConnection(userId: string, platform: PlatformName): PlatformConnection | undefined {
  const stmt = db.prepare('SELECT * FROM platform_connections WHERE user_id = ? AND platform = ?');
  const row = stmt.get(userId, platform) as (PlatformConnection & { is_connected: number }) | undefined;
  if (!row) return undefined;
  return {
    ...row,
    is_connected: Boolean(row.is_connected),
  };
}

export function savePlatformConnection(
  userId: string,
  platform: PlatformName,
  tokens: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    accountId?: string;
    accountName?: string;
  }
): PlatformConnection {
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO platform_connections (
      id, user_id, platform, access_token, refresh_token, token_expires_at,
      account_id, account_name, is_connected
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(user_id, platform) DO UPDATE SET
      access_token = excluded.access_token,
      refresh_token = excluded.refresh_token,
      token_expires_at = excluded.token_expires_at,
      account_id = excluded.account_id,
      account_name = excluded.account_name,
      is_connected = 1,
      updated_at = CURRENT_TIMESTAMP
  `);

  stmt.run(
    id,
    userId,
    platform,
    tokens.accessToken || null,
    tokens.refreshToken || null,
    tokens.expiresAt || null,
    tokens.accountId || null,
    tokens.accountName || null
  );

  return getPlatformConnection(userId, platform)!;
}

export function disconnectPlatform(userId: string, platform: PlatformName): boolean {
  const stmt = db.prepare(`
    UPDATE platform_connections
    SET is_connected = 0, access_token = NULL, refresh_token = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND platform = ?
  `);
  const result = stmt.run(userId, platform);
  return result.changes > 0;
}

export function createDistributionRecord(
  imageId: string,
  userId: string,
  platform: PlatformName
): DistributionRecord {
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO distribution_history (id, image_id, user_id, platform, status)
    VALUES (?, ?, ?, ?, 'pending')
  `);

  stmt.run(id, imageId, userId, platform);
  return getDistributionRecord(id)!;
}

export function getDistributionRecord(id: string): DistributionRecord | undefined {
  const stmt = db.prepare('SELECT * FROM distribution_history WHERE id = ?');
  return stmt.get(id) as DistributionRecord | undefined;
}

export function updateDistributionStatus(
  id: string,
  status: DistributionRecord['status'],
  externalId?: string,
  errorMessage?: string
): DistributionRecord | undefined {
  const stmt = db.prepare(`
    UPDATE distribution_history
    SET status = ?, external_id = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(status, externalId || null, errorMessage || null, id);
  return getDistributionRecord(id);
}

export function getDistributionHistory(
  userId: string,
  imageId?: string
): DistributionRecord[] {
  let stmt;
  if (imageId) {
    stmt = db.prepare(`
      SELECT * FROM distribution_history
      WHERE user_id = ? AND image_id = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(userId, imageId) as DistributionRecord[];
  } else {
    stmt = db.prepare(`
      SELECT * FROM distribution_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `);
    return stmt.all(userId) as DistributionRecord[];
  }
}

// Platform-specific distribution implementations
// These would integrate with actual platform APIs in production

export interface DistributionOptions {
  imageBuffer: Buffer;
  mimeType: string;
  keywords: string[];
  title?: string;
  description?: string;
}

export async function distributeToStock(
  platform: PlatformName,
  connection: PlatformConnection,
  options: DistributionOptions
): Promise<{ success: boolean; externalId?: string; error?: string }> {
  // In production, this would call the actual platform API
  // For now, we validate the connection and simulate the upload

  if (!connection.is_connected || !connection.access_token) {
    return { success: false, error: 'Platform not connected or missing access token' };
  }

  // Simulate API call
  console.log(`Distributing to ${platform} with ${options.keywords.length} keywords`);

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // In real implementation:
  // - Adobe Stock: Use Adobe Stock Contributor API
  // - Getty Images: Use Getty Contributor API
  // - Shutterstock: Use Shutterstock Contributor API

  return {
    success: true,
    externalId: `${platform.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
  };
}

export async function distributeToSocial(
  platform: PlatformName,
  connection: PlatformConnection,
  options: DistributionOptions & { caption?: string }
): Promise<{ success: boolean; externalId?: string; error?: string }> {
  if (!connection.is_connected || !connection.access_token) {
    return { success: false, error: 'Platform not connected or missing access token' };
  }

  console.log(`Posting to ${platform}`);
  await new Promise((resolve) => setTimeout(resolve, 500));

  // In real implementation:
  // - Instagram: Use Instagram Graph API
  // - Pinterest: Use Pinterest API
  // - TikTok: Use TikTok Developer API
  // - X: Use Twitter API v2
  // - Facebook: Use Facebook Graph API

  return {
    success: true,
    externalId: `${platform.toLowerCase().replace(/[\s()]/g, '-')}-${Date.now()}`,
  };
}
