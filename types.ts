import { Chat } from "@google/genai";

export enum AppView {
  WELCOME = 'Welcome',
  LIGHT_BOX = 'Light Box',
  EDIT = 'Edit',
  STUDIO = 'Studio',
  AGENT_CHAT = 'Agent Chat',
  EARNINGS = 'Earnings',
  SETTINGS = 'Settings',
  PORTFOLIO = 'Portfolio',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AnalysisResult {
  monetization_score: {
    overall: number;
    technical_quality_score: number;
    commercial_appeal_score: number;
    market_rarity_score: number;
    emotional_resonance_score: number;
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
  };
  market_comparison: {
    description: string;
    reasoning: string;
  }[];
}

export interface ImageData {
  base64: string;
  mimeType: string;
  preview: string;
}

export interface ActiveImage {
  id: string;
  data: ImageData;
  analysis?: AnalysisResult | null;
  isAnalyzed: boolean;
  isLoading: boolean;
  isDistributed?: boolean;
  distributionResult?: DistributionResult | null;
  performanceData?: PerformanceData | null;
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

// --- Settings & Distribution Types ---

export type PlatformName = 'Adobe Stock' | 'Getty Images' | 'Shutterstock' | 'Etsy' | 'Redbubble' | 'Instagram' | 'Pinterest';

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