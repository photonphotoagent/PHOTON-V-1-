import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { OAuth2Client } from 'google-auth-library';
import {
  createUser,
  createGoogleUser,
  getUserByEmail,
  getUserByGoogleId,
  getUserById,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  validateRefreshToken,
  verifyToken,
  revokeRefreshTokens,
  toPublicUser,
  updateUser,
} from '../services/authService.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthRequest, LoginRequest, SignupRequest, GoogleAuthPayload } from '../types/index.js';
import { config } from '../config/env.js';

const router = Router();

// Validation middleware
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const signupValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('experienceLevel')
    .optional()
    .isIn(['Beginner', 'Enthusiast', 'Pro', 'Agency'])
    .withMessage('Invalid experience level'),
  body('archiveSize')
    .optional()
    .isIn(['Small', 'Medium', 'Large', 'Massive'])
    .withMessage('Invalid archive size'),
];

// POST /api/auth/signup
router.post('/signup', signupValidation, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
      return;
    }

    const data: SignupRequest = req.body;

    // Check if user already exists
    const existingUser = getUserByEmail(data.email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'Email already registered',
      });
      return;
    }

    const user = await createUser(data);
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    await storeRefreshToken(user.id, refreshToken);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create account',
    });
  }
});

// POST /api/auth/login
router.post('/login', loginValidation, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
      return;
    }

    const { email, password }: LoginRequest = req.body;

    const user = getUserByEmail(email);
    if (!user || !user.password_hash) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    await storeRefreshToken(user.id, refreshToken);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: toPublicUser(user),
        accessToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

// POST /api/auth/google
router.post('/google', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { idToken }: GoogleAuthPayload = req.body;

    if (!idToken) {
      res.status(400).json({
        success: false,
        error: 'ID token is required',
      });
      return;
    }

    // Verify Google ID token
    const client = new OAuth2Client(config.googleClientId);
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: config.googleClientId,
      });
    } catch (verifyError) {
      res.status(401).json({
        success: false,
        error: 'Invalid Google token',
      });
      return;
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      res.status(401).json({
        success: false,
        error: 'Invalid token payload',
      });
      return;
    }

    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists with this Google ID
    let user = getUserByGoogleId(googleId);

    if (!user) {
      // Check if email is already registered
      const existingUser = getUserByEmail(email);
      if (existingUser) {
        // Link Google account to existing user
        // For security, in production you might want additional verification
        res.status(409).json({
          success: false,
          error: 'Email already registered. Please login with email/password.',
        });
        return;
      }

      // Create new user
      const publicUser = await createGoogleUser(googleId, email, name || email.split('@')[0], picture);
      user = getUserById(publicUser.id);
    }

    if (!user) {
      res.status(500).json({
        success: false,
        error: 'Failed to create or retrieve user',
      });
      return;
    }

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    await storeRefreshToken(user.id, refreshToken);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: toPublicUser(user),
        accessToken,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Google authentication failed',
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'Refresh token required',
      });
      return;
    }

    let payload;
    try {
      payload = verifyToken(refreshToken);
    } catch {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
      return;
    }

    if (payload.type !== 'refresh') {
      res.status(401).json({
        success: false,
        error: 'Invalid token type',
      });
      return;
    }

    const isValid = await validateRefreshToken(payload.userId, refreshToken);
    if (!isValid) {
      res.status(401).json({
        success: false,
        error: 'Refresh token revoked or expired',
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

    const newAccessToken = generateAccessToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken(user.id, user.email);

    await storeRefreshToken(user.id, newRefreshToken);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      revokeRefreshTokens(req.user.id);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
    });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: AuthRequest, res: Response): void => {
  res.json({
    success: true,
    data: req.user,
  });
});

// PATCH /api/auth/me
router.patch(
  '/me',
  authMiddleware,
  [
    body('name').optional().trim().isLength({ min: 1 }).withMessage('Name cannot be empty'),
    body('experienceLevel')
      .optional()
      .isIn(['Beginner', 'Enthusiast', 'Pro', 'Agency'])
      .withMessage('Invalid experience level'),
    body('archiveSize')
      .optional()
      .isIn(['Small', 'Medium', 'Large', 'Massive'])
      .withMessage('Invalid archive size'),
  ],
  (req: AuthRequest, res: Response): void => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const updates: any = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.experienceLevel) updates.experience_level = req.body.experienceLevel;
      if (req.body.archiveSize) updates.archive_size = req.body.archiveSize;

      const updatedUser = updateUser(req.user.id, updates);

      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user',
      });
    }
  }
);

export default router;
