import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { AuthRequest, PlatformName } from '../types/index.js';
import {
  SUPPORTED_PLATFORMS,
  getPlatformConnections,
  getPlatformConnection,
  savePlatformConnection,
  disconnectPlatform,
  createDistributionRecord,
  updateDistributionStatus,
  getDistributionHistory,
  distributeToStock,
  distributeToSocial,
} from '../services/platformService.js';
import { getImageById, getImageBuffer } from '../services/imageService.js';

const router = Router();

// GET /api/platforms - Get supported platforms
router.get('/', (req, res: Response): void => {
  res.json({
    success: true,
    data: SUPPORTED_PLATFORMS,
  });
});

// GET /api/platforms/connections - Get user's platform connections
router.get('/connections', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const connections = getPlatformConnections(req.user.id);

    // Map to a simpler format (hide tokens)
    const safeConnections = connections.map((conn) => ({
      platform: conn.platform,
      isConnected: conn.is_connected,
      accountName: conn.account_name,
      connectedAt: conn.created_at,
    }));

    res.json({
      success: true,
      data: safeConnections,
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve connections',
    });
  }
});

// POST /api/platforms/connect - Connect to a platform
router.post('/connect', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { platform, accessToken, refreshToken, expiresAt, accountId, accountName } = req.body;

    if (!platform) {
      res.status(400).json({ success: false, error: 'Platform is required' });
      return;
    }

    // Validate platform name
    const isValidPlatform = SUPPORTED_PLATFORMS.some((p) => p.name === platform);
    if (!isValidPlatform) {
      res.status(400).json({ success: false, error: 'Invalid platform' });
      return;
    }

    const connection = savePlatformConnection(req.user.id, platform as PlatformName, {
      accessToken,
      refreshToken,
      expiresAt,
      accountId,
      accountName,
    });

    res.json({
      success: true,
      data: {
        platform: connection.platform,
        isConnected: connection.is_connected,
        accountName: connection.account_name,
      },
    });
  } catch (error) {
    console.error('Connect platform error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect platform',
    });
  }
});

// DELETE /api/platforms/disconnect/:platform - Disconnect from a platform
router.delete(
  '/disconnect/:platform',
  authMiddleware,
  (req: AuthRequest, res: Response): void => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const platform = req.params.platform as PlatformName;

      const isValidPlatform = SUPPORTED_PLATFORMS.some((p) => p.name === platform);
      if (!isValidPlatform) {
        res.status(400).json({ success: false, error: 'Invalid platform' });
        return;
      }

      const disconnected = disconnectPlatform(req.user.id, platform);

      if (!disconnected) {
        res.status(404).json({ success: false, error: 'Connection not found' });
        return;
      }

      res.json({
        success: true,
        message: `Disconnected from ${platform}`,
      });
    } catch (error) {
      console.error('Disconnect platform error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disconnect platform',
      });
    }
  }
);

// POST /api/platforms/distribute - Distribute an image to platforms
router.post('/distribute', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { imageId, platforms, keywords, title, description, caption } = req.body;

    if (!imageId || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      res.status(400).json({
        success: false,
        error: 'imageId and platforms array are required',
      });
      return;
    }

    // Verify image ownership
    const image = getImageById(imageId);
    if (!image || image.user_id !== req.user.id) {
      res.status(404).json({ success: false, error: 'Image not found' });
      return;
    }

    const imageBuffer = getImageBuffer(imageId);
    if (!imageBuffer) {
      res.status(404).json({ success: false, error: 'Image file not found' });
      return;
    }

    const results: { platform: string; success: boolean; error?: string; externalId?: string }[] = [];

    for (const platformName of platforms) {
      // Validate platform
      const platformInfo = SUPPORTED_PLATFORMS.find((p) => p.name === platformName);
      if (!platformInfo) {
        results.push({ platform: platformName, success: false, error: 'Invalid platform' });
        continue;
      }

      // Check connection
      const connection = getPlatformConnection(req.user.id, platformName as PlatformName);
      if (!connection || !connection.is_connected) {
        results.push({ platform: platformName, success: false, error: 'Platform not connected' });
        continue;
      }

      // Create distribution record
      const record = createDistributionRecord(imageId, req.user.id, platformName as PlatformName);

      try {
        // Update status to uploading
        updateDistributionStatus(record.id, 'uploading');

        let result;

        if (platformInfo.category === 'Social') {
          result = await distributeToSocial(platformName as PlatformName, connection, {
            imageBuffer,
            mimeType: image.mime_type,
            keywords: keywords || [],
            title,
            description,
            caption,
          });
        } else {
          result = await distributeToStock(platformName as PlatformName, connection, {
            imageBuffer,
            mimeType: image.mime_type,
            keywords: keywords || [],
            title,
            description,
          });
        }

        if (result.success) {
          updateDistributionStatus(record.id, 'success', result.externalId);
          results.push({
            platform: platformName,
            success: true,
            externalId: result.externalId,
          });
        } else {
          updateDistributionStatus(record.id, 'error', undefined, result.error);
          results.push({
            platform: platformName,
            success: false,
            error: result.error,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        updateDistributionStatus(record.id, 'error', undefined, errorMessage);
        results.push({
          platform: platformName,
          success: false,
          error: errorMessage,
        });
      }
    }

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: platforms.length,
          successful: successful.length,
          failed: failed.length,
        },
      },
    });
  } catch (error) {
    console.error('Distribution error:', error);
    res.status(500).json({
      success: false,
      error: 'Distribution failed',
    });
  }
});

// GET /api/platforms/distribution-history - Get distribution history
router.get('/distribution-history', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const imageId = req.query.imageId as string | undefined;
    const history = getDistributionHistory(req.user.id, imageId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Get distribution history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve distribution history',
    });
  }
});

export default router;
