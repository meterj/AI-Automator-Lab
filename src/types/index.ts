// src/types/index.ts - 타입 정의 (Groq 사용)

export interface Post {
  id?: number;
  title: string;
  content: string;
  excerpt?: string;
  categories?: string[];
  tags?: string[];
  status: 'draft' | 'publish' | 'pending';
  createdAt: Date;
  publishedAt?: Date;
  wordpressId?: number;
  wordpressUrl?: string;
  source: 'ai' | 'rss' | 'manual';
  sourceUrl?: string;
}

export interface RSSItem {
  title: string;
  content: string;
  link: string;
  pubDate?: string;
  author?: string;
  categories?: string[];
  imageUrl?: string;
}

export interface AIGenerationConfig {
  topic: string;
  keywords?: string[];
  tone?: 'formal' | 'casual' | 'friendly';
  length?: 'short' | 'medium' | 'long';
  language?: string;
}

export interface PublishResult {
  success: boolean;
  postId?: number;
  postUrl?: string;
  error?: string;
}

export interface SchedulerConfig {
  cron: string;
  enabled: boolean;
  mode: 'ai' | 'rss' | 'both';
}

export interface AppConfig {
  wordpress: {
    siteUrl: string;
    username: string;
    password: string;
    apiUrl: string;
  };
  groq: {
    apiKey: string;
    model: string;
  };
  rss: {
    feeds: string[];
  };
  scheduler: SchedulerConfig;
  server: {
    port: number;
    nodeEnv: string;
  };
  database: {
    path: string;
  };
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
}
