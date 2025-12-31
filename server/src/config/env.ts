export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'photon-agent-secret-change-in-production',
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // File Storage
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB default

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  // Platform API Keys (to be configured by admin/user)
  platforms: {
    adobeStock: {
      apiKey: process.env.ADOBE_STOCK_API_KEY || '',
      clientSecret: process.env.ADOBE_STOCK_SECRET || '',
    },
    shutterstock: {
      apiKey: process.env.SHUTTERSTOCK_API_KEY || '',
      clientSecret: process.env.SHUTTERSTOCK_SECRET || '',
    },
    gettyImages: {
      apiKey: process.env.GETTY_API_KEY || '',
      clientSecret: process.env.GETTY_SECRET || '',
    },
  },
};
