import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import db from '../config/database.js';
import { config } from '../config/env.js';
import { Image, AnalysisResult } from '../types/index.js';

// Ensure upload directories exist
const uploadsDir = path.resolve(config.uploadDir);
const imagesDir = path.join(uploadsDir, 'images');
const previewsDir = path.join(uploadsDir, 'previews');

[uploadsDir, imagesDir, previewsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export interface SaveImageOptions {
  userId: string;
  buffer: Buffer;
  mimeType: string;
  originalFilename?: string;
}

export interface ImageWithAnalysis extends Image {
  analysis?: AnalysisResult | null;
}

export async function saveImage(options: SaveImageOptions): Promise<Image> {
  const { userId, buffer, mimeType, originalFilename } = options;
  const id = uuidv4();
  const ext = mimeType.split('/')[1] || 'png';
  const filename = `${id}.${ext}`;
  const storagePath = path.join(imagesDir, filename);

  // Save file to disk
  await fs.promises.writeFile(storagePath, buffer);

  // Create database record
  const stmt = db.prepare(`
    INSERT INTO images (id, user_id, filename, original_filename, mime_type, file_size, storage_path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, userId, filename, originalFilename || null, mimeType, buffer.length, storagePath);

  return getImageById(id)!;
}

export function getImageById(id: string): Image | undefined {
  const stmt = db.prepare('SELECT * FROM images WHERE id = ?');
  const row = stmt.get(id) as (Image & { is_analyzed: number; is_distributed: number }) | undefined;
  if (!row) return undefined;

  return {
    ...row,
    is_analyzed: Boolean(row.is_analyzed),
    is_distributed: Boolean(row.is_distributed),
  };
}

export function getImagesByUserId(userId: string): Image[] {
  const stmt = db.prepare(`
    SELECT * FROM images WHERE user_id = ? ORDER BY created_at DESC
  `);
  const rows = stmt.all(userId) as (Image & { is_analyzed: number; is_distributed: number })[];

  return rows.map((row) => ({
    ...row,
    is_analyzed: Boolean(row.is_analyzed),
    is_distributed: Boolean(row.is_distributed),
  }));
}

export function getImagesWithAnalysis(userId: string): ImageWithAnalysis[] {
  const stmt = db.prepare(`
    SELECT
      i.*,
      ar.id as analysis_id,
      ar.scores_json,
      ar.monetization_json,
      ar.curation_json,
      ar.social_strategy_json,
      ar.market_comparison_json,
      ar.creative_remixes_json,
      ar.created_at as analysis_created_at
    FROM images i
    LEFT JOIN analysis_results ar ON i.id = ar.image_id
    WHERE i.user_id = ?
    ORDER BY i.created_at DESC
  `);

  const rows = stmt.all(userId) as any[];

  return rows.map((row) => {
    const image: ImageWithAnalysis = {
      id: row.id,
      user_id: row.user_id,
      filename: row.filename,
      original_filename: row.original_filename,
      mime_type: row.mime_type,
      file_size: row.file_size,
      storage_path: row.storage_path,
      preview_path: row.preview_path,
      is_analyzed: Boolean(row.is_analyzed),
      is_distributed: Boolean(row.is_distributed),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    if (row.analysis_id) {
      image.analysis = {
        id: row.analysis_id,
        image_id: row.id,
        scores_json: row.scores_json,
        monetization_json: row.monetization_json,
        curation_json: row.curation_json,
        social_strategy_json: row.social_strategy_json,
        market_comparison_json: row.market_comparison_json,
        creative_remixes_json: row.creative_remixes_json,
        created_at: row.analysis_created_at,
      };
    }

    return image;
  });
}

export function deleteImage(id: string, userId: string): boolean {
  // Verify ownership
  const image = getImageById(id);
  if (!image || image.user_id !== userId) return false;

  // Delete file from disk
  try {
    if (fs.existsSync(image.storage_path)) {
      fs.unlinkSync(image.storage_path);
    }
    if (image.preview_path && fs.existsSync(image.preview_path)) {
      fs.unlinkSync(image.preview_path);
    }
  } catch (err) {
    console.error('Error deleting image files:', err);
  }

  // Delete from database (cascades to analysis and distribution records)
  const stmt = db.prepare('DELETE FROM images WHERE id = ? AND user_id = ?');
  const result = stmt.run(id, userId);
  return result.changes > 0;
}

export function saveAnalysisResult(imageId: string, analysis: {
  scores?: object;
  monetization?: object;
  curation?: object;
  socialStrategy?: object;
  marketComparison?: object;
  creativeRemixes?: object;
}): AnalysisResult {
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO analysis_results (
      id, image_id, scores_json, monetization_json, curation_json,
      social_strategy_json, market_comparison_json, creative_remixes_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(image_id) DO UPDATE SET
      scores_json = excluded.scores_json,
      monetization_json = excluded.monetization_json,
      curation_json = excluded.curation_json,
      social_strategy_json = excluded.social_strategy_json,
      market_comparison_json = excluded.market_comparison_json,
      creative_remixes_json = excluded.creative_remixes_json
  `);

  stmt.run(
    id,
    imageId,
    analysis.scores ? JSON.stringify(analysis.scores) : null,
    analysis.monetization ? JSON.stringify(analysis.monetization) : null,
    analysis.curation ? JSON.stringify(analysis.curation) : null,
    analysis.socialStrategy ? JSON.stringify(analysis.socialStrategy) : null,
    analysis.marketComparison ? JSON.stringify(analysis.marketComparison) : null,
    analysis.creativeRemixes ? JSON.stringify(analysis.creativeRemixes) : null
  );

  // Mark image as analyzed
  const updateStmt = db.prepare('UPDATE images SET is_analyzed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  updateStmt.run(imageId);

  return getAnalysisByImageId(imageId)!;
}

export function getAnalysisByImageId(imageId: string): AnalysisResult | undefined {
  const stmt = db.prepare('SELECT * FROM analysis_results WHERE image_id = ?');
  return stmt.get(imageId) as AnalysisResult | undefined;
}

export function getImageBuffer(id: string): Buffer | null {
  const image = getImageById(id);
  if (!image) return null;

  try {
    return fs.readFileSync(image.storage_path);
  } catch (err) {
    console.error('Error reading image file:', err);
    return null;
  }
}
