
import { Chat } from "@google/genai";

export enum AppView {
  WELCOME = 'Welcome',
  LIGHT_BOX = 'Light Box',
  EDIT = 'Edit',
  STUDIO = 'Studio',
  ROUTES = 'Routes',
  EARNINGS = 'Earnings',
  SETTINGS = 'Settings',
  PORTFOLIO = 'Portfolio',
  LOGIN = 'Login'
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  experienceLevel?: 'Beginner' | 'Enthusiast' | 'Pro' | 'Agency';
  archiveSize?: 'Small' | 'Medium' | 'Large' | 'Massive';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  workflow?: Workflow; // Optional: The model might return a workflow
}

export interface RouteChatMessage {
  role: 'user' | 'model';
  text: string;
  options?: string[];
  build_trigger?: boolean;
}

export interface WorkflowStep {
    id: string;
    name: string;
    description: string;
    actor: 'human' | 'system'; // New field: Who performs the action?
    status: 'pending' | 'running' | 'completed' | 'error';
    icon?: string; // e.g., 'upload', 'ai', 'edit'
    output?: string; // The simulated or real output of this step
}

export interface Workflow {
    id: string;
    title: string;
    description: string;
    steps: WorkflowStep[];
    isActive: boolean;
    progress: number;
    logs: string[];
}

export interface CreativeRemix {
  title: string;
  description: string;
  prompt: string;
  vibe: string; // e.g. "Retro", "Futuristic", "Abstract"
  category: 'Social' | 'Commercial' | 'Artistic' | 'Fantasy';
}

export interface ShotConcept {
  title: string;
  visual_description: string;
  technical_specs: string; // Lens, lighting, settings
  art_direction: string; // Posing, mood, colors
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface AnalysisResult {
  scores: {
    monetization: number;   // Commercial value
    social: number;         // Viral potential
    portfolio: number;      // Artistic merit
    technical_quality: number;
  };
  monetization_strategy: {
    best_use_case: string;
    suggested_keywords: string[];
    art_director_caption: string;
  };
  curation_insights: {
    composition_and_framing: string;
    lighting_and_color: string;
    subject_and_narrative: string;
    actionable_fix: string;
  };
  social_media_strategy: {
    suggested_edits: {
      suggestion: string;
      impact: string;
    }[];
    social_media_appeal: string;
    sample_posts: {
      platform: string;
      post_text: string;
    }[];
    hashtag_groups: {
        niche: string[];
        viral: string[];
        broad: string[];
    };
  };
  market_comparison: {
    description: string;
    reasoning: string;
  }[];
  creative_remixes: CreativeRemix[];
}

export interface ImageData {
  base64: string;
  mimeType: string;
  preview: string;
}

export interface ImageAdjustments {
  // Light
  exposure: number;    // 100 default
  contrast: number;    // 100 default
  highlights: number;  // 100 default
  shadows: number;     // 100 default
  gamma: number;       // 100 default (1.0) - Curve proxy
  
  // Color
  saturation: number;  // 100 default
  warmth: number;      // 0 default (sepia-ish)
  tint: number;        // 0 default (hue-rotate)
  vibrance: number;    // 100 default

  // Channel Mixer (RGB)
  redChannel: number;   // 100 default
  greenChannel: number; // 100 default
  blueChannel: number;  // 100 default

  // Split Toning
  highlightsHue: number; // 0-360
  highlightsSat: number; // 0-100
  shadowsHue: number;    // 0-360
  shadowsSat: number;    // 0-100

  // Detail & Effects
  blur: number;        // 0 default
  sharpen: number;     // 0 default (simulated)
  vignette: number;    // 0 default (overlay)
  grain: number;       // 0 default (overlay)
}

export interface ActiveImage {
  id: string;
  data: ImageData;
  analysis?: AnalysisResult | null;
  adjustments?: ImageAdjustments; // New field for manual edits
  isAnalyzed: boolean;
  isLoading: boolean;
  isDistributed?: boolean;
  distributionResult?: DistributionResult | null;
  performanceData?: PerformanceData | null;
  lastModified?: number; // For syncing
}

export interface EditHistoryItem {
    id: string;
    thumbnail: string;
    actionName: string;
    imageData: ImageData;
    adjustments?: ImageAdjustments; // Capture slider state in history
    timestamp: number;
}

// --- Earnings Dashboard Types ---

export interface Sale {
  id: string;
  photo: {
    thumbnailUrl: string;
    title: string;
  };
  platform: string;
  date: string;
  earnings: number;
}

export interface EarningsData {
  totalEarnings: number;
  photosSold: number;
  topPlatform: string;
  earningsOverTime: { date: string; amount: number }[];
  topPerformingPhotos: {
    id: string;
    thumbnailUrl: string;
    title: string;
    earnings: number;
  }[];
  recentSales: Sale[];
}

// --- AI Settings Types ---

export interface AISettings {
  critiqueLevel: number;      // 1-10: 1=Gentle, 10=Brutally Honest
  creativityLevel: number;    // 1-10: 1=Safe/Realistic, 10=Wild/Abstract
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  critiqueLevel: 7,
  creativityLevel: 5,
};

// --- Settings & Distribution Types ---

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

export interface Platform {
  name: PlatformName;
  category: 'Stock' | 'Print' | 'Social';
  logo: string;
}

export type Connections = Partial<Record<PlatformName, boolean>>;

export interface DistributionStatus {
    platform: PlatformName;
    status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
    message: string;
}

export interface DistributionResult {
    success: PlatformName[];
    failed: { platform: PlatformName; reason: string }[];
}

// --- Portfolio & Analytics Types ---
export interface PerformanceMetrics {
    views: number;
    downloads: number;
    earnings: number;
    earningsOverTime?: { day: number; amount: number }[];
}

export type PerformanceData = Partial<Record<PlatformName, PerformanceMetrics>>;

export interface CalendarEvent {
  id: string;
  date: Date;
  platform: PlatformName;
  content: string;
  thumbnail: string;
  status: 'scheduled' | 'published';
}
