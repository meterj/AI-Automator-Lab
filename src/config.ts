// src/config.ts - 환경 설정

import dotenv from 'dotenv';
import { AppConfig } from './types';

dotenv.config();

const defaultNodeEnv = process.env.NODE_ENV || 'development';

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`환경 변수 ${key}가 필요합니다.`);
  }
  return value || defaultValue!;
}

function getEnvArray(key: string, defaultValue: string[] = []): string[] {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.split(',').map(v => v.trim()).filter(v => v.length > 0);
}

export const config: AppConfig = {
  wordpress: {
    siteUrl: getEnv('WORDPRESS_SITE_URL'),
    username: getEnv('WORDPRESS_USERNAME'),
    password: getEnv('WORDPRESS_PASSWORD'),
    apiUrl: getEnv('WORDPRESS_API_URL'),
  },
  groq: {
    apiKey: getEnv('GROQ_API_KEY'),
    model: getEnv('GROQ_MODEL', 'llama3-8b-8192'),
  },
  rss: {
    feeds: getEnvArray('RSS_FEEDS'),
  },
  scheduler: {
    cron: getEnv('SCHEDULE_CRON', '0 9 * * *'),
    enabled: getEnv('SCHEDULE_ENABLED', defaultNodeEnv === 'production' ? 'true' : 'false') === 'true',
    mode: (getEnv('SCHEDULE_MODE', defaultNodeEnv === 'production' ? 'rss' : 'ai') as 'ai' | 'rss' | 'both'),
  },
  server: {
    port: parseInt(getEnv('PORT', '3000')),
    nodeEnv: getEnv('NODE_ENV', defaultNodeEnv),
  },
  database: {
    path: getEnv('DATABASE_PATH', './data/posts.db'),
  },
  supabase: {
    url: getEnv('SUPABASE_URL', ''),
    serviceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY', ''),
  },
};

export function validateConfig(): void {
  const warnings: string[] = [];

  if (!config.groq.apiKey || config.groq.apiKey.startsWith('sk-your')) {
    warnings.push('Groq API 키가 설정되지 않았습니다. AI 글 생성이 작동하지 않습니다.');
  }
  
  if (!config.wordpress.password || config.wordpress.password === 'your_application_password') {
    warnings.push('WordPress 비밀번호가 설정되지 않았습니다. 포스팅이 불가능합니다.');
  }
  
  if (config.rss.feeds.length === 0) {
    warnings.push('RSS 피드가 설정되지 않았습니다. RSS 수집이 불가능합니다.');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️ 설정 경고:');
    warnings.forEach(w => console.log(`   - ${w}`));
    console.log('   .env 파일을 확인해주세요.');
  }
}
