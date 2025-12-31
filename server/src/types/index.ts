import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  name: string;
  avatar?: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  experience_level?: 'Beginner' | 'Enthusiast' | 'Pro' | 'Agency';
  archive_size?: 'Small' | 'Medium' | 'Large' | 'Massive';
  google_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  experienceLevel?: 'Beginner' | 'Enthusiast' | 'Pro' | 'Agency';
  archiveSize?: 'Small' | 'Medium' | 'Large' | 'Massive';
}

export interface AuthRequest extends Request {
  user?: UserPublic;
}

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  experienceLevel?: 'Beginner' | 'Enthusiast' | 'Pro' | 'Agency';
  archiveSize?: 'Small' | 'Medium' | 'Large' | 'Massive';
}

export interface GoogleAuthPayload {
  idToken: string;
}

export interface Image {
  id: string;
  user_id: string;
  filename: string;
  original_filename?: string;
  mime_type: string;
  file_size?: number;
  storage_path: string;
  preview_path?: string;
  is_analyzed: boolean;
  is_distributed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalysisResult {
  id: string;
  image_id: string;
  scores_json?: string;
  monetization_json?: string;
  curation_json?: string;
  social_strategy_json?: string;
  market_comparison_json?: string;
  creative_remixes_json?: string;
  created_at: string;
}

export type PlatformName =
  | 'Adobe Stock'
  | 'Getty Images'
  | 'Shutterstock'
  | 'Alamy'
  | '500px'
  | 'Etsy'
  | 'Redbubble'
  | 'Society6'
  | 'Fine Art America'
  | 'Instagram'
  | 'Pinterest'
  | 'TikTok'
  | 'X (Twitter)'
  | 'Facebook';

export interface PlatformConnection {
  id: string;
  user_id: string;
  platform: PlatformName;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  account_id?: string;
  account_name?: string;
  is_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface DistributionRecord {
  id: string;
  image_id: string;
  user_id: string;
  platform: PlatformName;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  external_id?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
