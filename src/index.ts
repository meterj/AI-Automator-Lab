// src/index.ts - 메인 서버 진입점

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import { config, validateConfig } from './config';
import { wpClient } from './wordpress/client';
import { aiGenerator } from './groq/generator';
import { rssCollector } from './rss/parser';
import { scheduler } from './scheduler/cron';
import { db } from './db/database';
import { AIGenerationConfig, Post } from './types';

const app = express();
app.use(cors()); // CORS 허용
app.use(express.json());
app.use(express.static('public'));

// 요청 로깅 미들웨어
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============ API 라우트 ============

// 헬스체크
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    config: {
      wordpress: config.wordpress.siteUrl,
      schedulerEnabled: config.scheduler.enabled,
      rssFeedsCount: config.rss.feeds.length,
    },
  });
});

// 통계 조회
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: '통계 조회 실패' });
  }
});

// 글 목록 조회
app.get('/api/posts', async (req: Request, res: Response) => {
  try {
    const { source, status, limit = '20', offset = '0' } = req.query;
    
    const posts = await db.getPosts({
      source: source as 'ai' | 'rss' | 'manual',
      status: status as 'draft' | 'publish' | 'pending',
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: '글 목록 조회 실패' });
  }
});

// 글 상세 조회
app.get('/api/posts/:id', async (req: Request, res: Response) => {
  try {
    const post = await db.getPostById(parseInt(req.params.id));
    
    if (!post) {
      return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
    }
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: '글 상세 조회 실패' });
  }
});

// AI 글 생성 및 발행
app.post('/api/publish/ai', async (req: Request, res: Response) => {
  try {
    const { topic, keywords, tone, length, publish = false } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: '주제(topic)가 필요합니다.' });
    }
    
    const genConfig: AIGenerationConfig = {
      topic,
      keywords,
      tone,
      length,
      language: 'Korean',
    };
    
    console.log(`[API] AI 글 생성 요청: ${topic}`);
    
    const post = await aiGenerator.generatePost(genConfig);
    
    if (publish) {
      const result = await wpClient.publishPost({
        ...post,
        status: 'publish',
      });
      
      if (result.success) {
        const savedPost = await db.savePost({
          ...post,
          status: 'publish',
          wordpressId: result.postId,
          wordpressUrl: result.postUrl,
          publishedAt: new Date(),
        });
        
        return res.json({
          success: true,
          post: savedPost,
          wordpressUrl: result.postUrl,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error,
          post,
        });
      }
    }
    
    return res.json({
      success: true,
      post,
      published: false,
    });
  } catch (error) {
    console.error('[API] AI 글 생성 오류:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
});

// RSS 수집 및 발행
app.post('/api/publish/rss', async (req: Request, res: Response) => {
  try {
    const { keywords, days = 7, maxPosts = 5, publish = false } = req.body;
    
    console.log('[API] RSS 수집 요청');
    
    const posts = await rssCollector.collectPosts({
      keywords,
      days,
      maxPosts,
      includeSourceLink: true,
    });
    
    if (posts.length === 0) {
      return res.json({
        success: true,
        collected: 0,
        published: 0,
        message: '수집된 글이 없습니다.',
      });
    }
    
    if (!publish) {
      return res.json({
        success: true,
        collected: posts.length,
        published: 0,
        posts,
      });
    }
    
    const results: Array<{ post: Post; success: boolean; url?: string; error?: string }> = [];
    
    for (const post of posts) {
      if (post.sourceUrl && await db.existsByUrl(post.sourceUrl)) {
        results.push({ post, success: false, error: '이미 발행된 글' });
        continue;
      }
      
      const result = await wpClient.publishPost({
        ...post,
        status: 'publish',
      });
      
      if (result.success) {
        const savedPost = await db.savePost({
          ...post,
          status: 'publish',
          wordpressId: result.postId,
          wordpressUrl: result.postUrl,
          publishedAt: new Date(),
        });
        
        results.push({ post: savedPost, success: true, url: result.postUrl });
      } else {
        results.push({ post, success: false, error: result.error });
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    const publishedCount = results.filter(r => r.success).length;
    
    return res.json({
      success: true,
      collected: posts.length,
      published: publishedCount,
      results,
    });
  } catch (error) {
    console.error('[API] RSS 수집/발행 오류:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
});

// 수동 글 발행
app.post('/api/publish/manual', async (req: Request, res: Response) => {
  try {
    const { title, content, categories, tags, status = 'draft' } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: '제목(title)과 내용(content)이 필요합니다.' });
    }
    
    const post: Post = {
      title,
      content,
      categories,
      tags,
      status,
      createdAt: new Date(),
      source: 'manual',
    };
    
    const result = await wpClient.publishPost(post);
    
    if (result.success) {
      const savedPost = await db.savePost({
        ...post,
        wordpressId: result.postId,
        wordpressUrl: result.postUrl,
        publishedAt: status === 'publish' ? new Date() : undefined,
      });
      
      return res.json({
        success: true,
        post: savedPost,
        wordpressUrl: result.postUrl,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: result.error,
    });
  } catch (error) {
    console.error('[API] 수동 발행 오류:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
});

// 스케줄 상태 조회
app.get('/api/schedule', (req: Request, res: Response) => {
  const jobs = scheduler.getAllJobStatus();
  res.json({
    enabled: config.scheduler.enabled,
    defaultCron: config.scheduler.cron,
    mode: config.scheduler.mode,
    jobs,
  });
});

// 스케줄 수동 실행
app.post('/api/schedule/run', async (req: Request, res: Response) => {
  try {
    const { mode = 'both' } = req.body;
    
    console.log(`[API] 스케줄 수동 실행: ${mode}`);
    
    if (mode === 'ai' || mode === 'both') {
      await scheduler.publishAIPost({ topic: '자동 생성 글' });
    }
    
    if (mode === 'rss' || mode === 'both') {
      await scheduler.publishRSSPosts();
    }
    
    res.json({ success: true, message: '스케줄 실행 완료' });
  } catch (error) {
    console.error('[API] 스케줄 실행 오류:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
});

// 글 삭제
app.delete('/api/posts/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const post = await db.getPostById(id);
    if (!post) {
      return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
    }
    
    const deleted = await db.deletePost(id);
    if (deleted) {
      return res.json({ success: true, message: '글이 삭제되었습니다.' });
    }
    return res.status(500).json({ error: '글 삭제 실패' });
  } catch (error) {
    return res.status(500).json({ error: '글 삭제 중 오류 발생' });
  }
});

// ============ 에러 핸들링 ============

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : '서버 오류',
  });
});

// ============ 서버 시작 ============

const PORT = config.server.port;

async function startServer() {
  try {
    // 데이터베이스 초기화
    await db.initialize();
    console.log('데이터베이스 초기화 완료');
    
    // 서버 시작
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('AI Automator Blog Server 시작');
      console.log('='.repeat(50));
      console.log(`포트: ${PORT}`);
      console.log(`환경: ${config.server.nodeEnv}`);
      console.log(`Supabase 연동 완료`);
      console.log(`스케줄러: ${config.scheduler.enabled ? '활성화' : '비활성화'}`);
      console.log('='.repeat(50));
      
      validateConfig();
      
      if (config.scheduler.enabled) {
        scheduler.startDefaultSchedule();
      }
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

startServer();

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  console.log('\n서버 종료 중...');
  scheduler.stopAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n서버 종료 중...');
  scheduler.stopAll();
  process.exit(0);
});