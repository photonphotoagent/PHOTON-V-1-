import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { verifyToken, getUserById, toPublicUser } from '../services/authService.js';

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = verifyToken(token);

      if (payload.type !== 'access') {
        res.status(401).json({
          success: false,
          error: 'Invalid token type',
        });
        return;
      }

      const user = getUserById(payload.userId);
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      req.user = toPublicUser(user);
      next();
    } catch (tokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = verifyToken(token);
        if (payload.type === 'access') {
          const user = getUserById(payload.userId);
          if (user) {
            req.user = toPublicUser(user);
          }
        }
      } catch {
        // Token invalid, continue without user
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
}
