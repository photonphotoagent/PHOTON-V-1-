import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { config } from '../config/env.js';
import { User, UserPublic, TokenPayload, SignupRequest } from '../types/index.js';

const SALT_ROUNDS = 12;

export function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    plan: user.plan,
    experienceLevel: user.experience_level,
    archiveSize: user.archive_size,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(userId: string, email: string): string {
  const payload: TokenPayload = { userId, email, type: 'access' };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtAccessExpiry });
}

export function generateRefreshToken(userId: string, email: string): string {
  const payload: TokenPayload = { userId, email, type: 'refresh' };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtRefreshExpiry });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}

export async function createUser(data: SignupRequest): Promise<UserPublic> {
  const id = uuidv4();
  const passwordHash = await hashPassword(data.password);

  const stmt = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, experience_level, archive_size, plan)
    VALUES (?, ?, ?, ?, ?, ?, 'Free')
  `);

  stmt.run(
    id,
    data.email.toLowerCase(),
    passwordHash,
    data.name,
    data.experienceLevel || 'Beginner',
    data.archiveSize || 'Small'
  );

  const user = getUserById(id);
  if (!user) throw new Error('Failed to create user');
  return toPublicUser(user);
}

export async function createGoogleUser(
  googleId: string,
  email: string,
  name: string,
  avatar?: string
): Promise<UserPublic> {
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO users (id, email, name, avatar, google_id, plan)
    VALUES (?, ?, ?, ?, ?, 'Free')
  `);

  stmt.run(id, email.toLowerCase(), name, avatar || null, googleId);

  const user = getUserById(id);
  if (!user) throw new Error('Failed to create Google user');
  return toPublicUser(user);
}

export function getUserByEmail(email: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email.toLowerCase()) as User | undefined;
}

export function getUserById(id: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as User | undefined;
}

export function getUserByGoogleId(googleId: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE google_id = ?');
  return stmt.get(googleId) as User | undefined;
}

export async function storeRefreshToken(userId: string, token: string): Promise<void> {
  const id = uuidv4();
  const tokenHash = await hashPassword(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  // Clean up old tokens for this user (keep max 5)
  const deleteOld = db.prepare(`
    DELETE FROM refresh_tokens
    WHERE user_id = ?
    AND id NOT IN (
      SELECT id FROM refresh_tokens WHERE user_id = ? ORDER BY created_at DESC LIMIT 4
    )
  `);
  deleteOld.run(userId, userId);

  const stmt = db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, userId, tokenHash, expiresAt);
}

export async function validateRefreshToken(userId: string, token: string): Promise<boolean> {
  const stmt = db.prepare(`
    SELECT token_hash FROM refresh_tokens
    WHERE user_id = ? AND expires_at > datetime('now')
    ORDER BY created_at DESC
  `);
  const tokens = stmt.all(userId) as { token_hash: string }[];

  for (const { token_hash } of tokens) {
    if (await verifyPassword(token, token_hash)) {
      return true;
    }
  }
  return false;
}

export function revokeRefreshTokens(userId: string): void {
  const stmt = db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?');
  stmt.run(userId);
}

export function updateUser(
  id: string,
  updates: Partial<Pick<User, 'name' | 'avatar' | 'plan' | 'experience_level' | 'archive_size'>>
): UserPublic | undefined {
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.avatar !== undefined) {
    fields.push('avatar = ?');
    values.push(updates.avatar);
  }
  if (updates.plan !== undefined) {
    fields.push('plan = ?');
    values.push(updates.plan);
  }
  if (updates.experience_level !== undefined) {
    fields.push('experience_level = ?');
    values.push(updates.experience_level);
  }
  if (updates.archive_size !== undefined) {
    fields.push('archive_size = ?');
    values.push(updates.archive_size);
  }

  if (fields.length === 0) return getUserById(id) ? toPublicUser(getUserById(id)!) : undefined;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  const user = getUserById(id);
  return user ? toPublicUser(user) : undefined;
}
