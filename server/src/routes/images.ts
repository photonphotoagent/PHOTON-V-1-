import { Router, Response } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import {
  saveImage,
  getImageById,
  getImagesByUserId,
  getImagesWithAnalysis,
  deleteImage,
  saveAnalysisResult,
  getAnalysisByImageId,
  getImageBuffer,
} from '../services/imageService.js';
import { config } from '../config/env.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  },
});

// POST /api/images - Upload a new image
router.post(
  '/',
  authMiddleware,
  upload.single('image'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, error: 'No image file provided' });
        return;
      }

      const image = await saveImage({
        userId: req.user.id,
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        originalFilename: req.file.originalname,
      });

      res.status(201).json({
        success: true,
        data: image,
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload image',
      });
    }
  }
);

// POST /api/images/base64 - Upload an image as base64
router.post('/base64', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { base64, mimeType, filename } = req.body;

    if (!base64 || !mimeType) {
      res.status(400).json({ success: false, error: 'base64 and mimeType are required' });
      return;
    }

    const buffer = Buffer.from(base64, 'base64');

    if (buffer.length > config.maxFileSize) {
      res.status(400).json({ success: false, error: 'Image too large' });
      return;
    }

    const image = await saveImage({
      userId: req.user.id,
      buffer,
      mimeType,
      originalFilename: filename,
    });

    res.status(201).json({
      success: true,
      data: image,
    });
  } catch (error) {
    console.error('Base64 upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image',
    });
  }
});

// GET /api/images - Get all images for the authenticated user
router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const includeAnalysis = req.query.includeAnalysis === 'true';

    if (includeAnalysis) {
      const images = getImagesWithAnalysis(req.user.id);
      res.json({
        success: true,
        data: images,
      });
    } else {
      const images = getImagesByUserId(req.user.id);
      res.json({
        success: true,
        data: images,
      });
    }
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve images',
    });
  }
});

// GET /api/images/:id - Get a specific image
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const image = getImageById(req.params.id);

    if (!image) {
      res.status(404).json({ success: false, error: 'Image not found' });
      return;
    }

    if (image.user_id !== req.user.id) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    res.json({
      success: true,
      data: image,
    });
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve image',
    });
  }
});

// GET /api/images/:id/file - Get the image file
router.get('/:id/file', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const image = getImageById(req.params.id);

    if (!image) {
      res.status(404).json({ success: false, error: 'Image not found' });
      return;
    }

    if (image.user_id !== req.user.id) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    const buffer = getImageBuffer(req.params.id);
    if (!buffer) {
      res.status(404).json({ success: false, error: 'Image file not found' });
      return;
    }

    res.setHeader('Content-Type', image.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${image.filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Get image file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve image file',
    });
  }
});

// GET /api/images/:id/base64 - Get the image as base64
router.get('/:id/base64', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const image = getImageById(req.params.id);

    if (!image) {
      res.status(404).json({ success: false, error: 'Image not found' });
      return;
    }

    if (image.user_id !== req.user.id) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    const buffer = getImageBuffer(req.params.id);
    if (!buffer) {
      res.status(404).json({ success: false, error: 'Image file not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        base64: buffer.toString('base64'),
        mimeType: image.mime_type,
      },
    });
  } catch (error) {
    console.error('Get image base64 error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve image',
    });
  }
});

// DELETE /api/images/:id - Delete an image
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const deleted = deleteImage(req.params.id, req.user.id);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Image not found or access denied' });
      return;
    }

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image',
    });
  }
});

// POST /api/images/:id/analysis - Save analysis results for an image
router.post('/:id/analysis', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const image = getImageById(req.params.id);

    if (!image) {
      res.status(404).json({ success: false, error: 'Image not found' });
      return;
    }

    if (image.user_id !== req.user.id) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    const { scores, monetization, curation, socialStrategy, marketComparison, creativeRemixes } =
      req.body;

    const analysis = saveAnalysisResult(req.params.id, {
      scores,
      monetization,
      curation,
      socialStrategy,
      marketComparison,
      creativeRemixes,
    });

    res.status(201).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Save analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save analysis',
    });
  }
});

// GET /api/images/:id/analysis - Get analysis results for an image
router.get('/:id/analysis', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const image = getImageById(req.params.id);

    if (!image) {
      res.status(404).json({ success: false, error: 'Image not found' });
      return;
    }

    if (image.user_id !== req.user.id) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    const analysis = getAnalysisByImageId(req.params.id);

    if (!analysis) {
      res.status(404).json({ success: false, error: 'Analysis not found' });
      return;
    }

    // Parse JSON fields
    const parsedAnalysis = {
      ...analysis,
      scores: analysis.scores_json ? JSON.parse(analysis.scores_json) : null,
      monetization: analysis.monetization_json ? JSON.parse(analysis.monetization_json) : null,
      curation: analysis.curation_json ? JSON.parse(analysis.curation_json) : null,
      socialStrategy: analysis.social_strategy_json ? JSON.parse(analysis.social_strategy_json) : null,
      marketComparison: analysis.market_comparison_json
        ? JSON.parse(analysis.market_comparison_json)
        : null,
      creativeRemixes: analysis.creative_remixes_json
        ? JSON.parse(analysis.creative_remixes_json)
        : null,
    };

    res.json({
      success: true,
      data: parsedAnalysis,
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analysis',
    });
  }
});

export default router;
