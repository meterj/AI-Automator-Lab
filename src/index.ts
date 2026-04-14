import express, { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'crypto';
import cors from 'cors';
import { config, validateConfig } from './config';
import { wpClient } from './wordpress/client';
import { aiGenerator } from './groq/generator';
import { rssCollector } from './rss/parser';
import { scheduler } from './scheduler/cron';
import { db } from './db/database';
import { AIGenerationConfig, Post } from './types';
import { sanitizeHtmlFragment } from './content/sanitize';
import { getPostQualityIssues } from './content/quality';

const app = express();

function getScheduleTriggerToken(request: Request): string {
  const authorization = request.header('authorization');

  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim();
  }

  return request.header('x-schedule-token')?.trim() || '';
}

function isAuthorizedScheduleTrigger(request: Request): boolean {
  const expectedToken = config.scheduler.triggerToken;

  if (!expectedToken) {
    return true;
  }

  const providedToken = getScheduleTriggerToken(request);
  const expectedBuffer = Buffer.from(expectedToken);
  const providedBuffer = Buffer.from(providedToken);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', async (req: Request, res: Response) => {
  try {
    const subscribers = await db.getSubscriberReadiness();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      config: {
        wordpress: config.wordpress.siteUrl,
        schedulerEnabled: config.scheduler.enabled,
        rssFeedsCount: config.rss.feeds.length,
        scheduleTriggerProtected: Boolean(config.scheduler.triggerToken),
        subscriberStorageReady: subscribers.ready,
        subscriberCount: subscribers.count,
      },
    });
  } catch {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Failed to read health status',
    });
  }
});

app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.post('/api/subscribers', async (req: Request, res: Response) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const sourcePage = typeof req.body?.sourcePage === 'string' ? req.body.sourcePage.trim() : 'site';
    const referrer = typeof req.body?.referrer === 'string' ? req.body.referrer.trim() : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'A valid email address is required.',
      });
    }

    const result = await db.subscribe(email, {
      sourcePage,
      referrer,
      userAgent: req.header('user-agent') || '',
    });

    return res.json({
      success: true,
      status: result,
      message: result === 'created'
        ? 'You are now subscribed to the briefing.'
        : 'This email is already subscribed. We refreshed your status.',
    });
  } catch (error) {
    console.error('[API] Subscriber save error:', error);
    return res.status(500).json({
      success: false,
      error: 'Subscriber storage is not ready yet. Check the Supabase subscribers table.',
    });
  }
});

app.get('/api/posts', async (req: Request, res: Response) => {
  try {
    const { source, status, limit = '20', offset = '0' } = req.query;

    const posts = await db.getPosts({
      source: source as 'ai' | 'rss' | 'manual',
      status: status as 'draft' | 'publish' | 'pending',
      limit: Number.parseInt(limit as string, 10),
      offset: Number.parseInt(offset as string, 10),
    });

    res.json(posts);
  } catch {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.get('/api/posts/:id', async (req: Request, res: Response) => {
  try {
    const post = await db.getPostById(Number.parseInt(req.params.id, 10));

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

app.post('/api/publish/ai', async (req: Request, res: Response) => {
  try {
    const { topic, keywords, tone, length, publish = false } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'topic is required' });
    }

    const generationConfig: AIGenerationConfig = {
      topic,
      keywords,
      tone,
      length,
      language: 'Korean',
    };

    const post = await aiGenerator.generatePost(generationConfig);
    const qualityIssues = getPostQualityIssues(post);

    if (qualityIssues.length > 0) {
      return res.status(422).json({
        success: false,
        error: 'Generated content did not pass quality checks',
        issues: qualityIssues,
      });
    }

    if (!publish) {
      return res.json({
        success: true,
        post,
        published: false,
      });
    }

    const result = await wpClient.publishPost({
      ...post,
      status: 'publish',
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        post,
      });
    }

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
  } catch (error) {
    console.error('[API] AI publish error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/publish/rss', async (req: Request, res: Response) => {
  try {
    const { keywords, days = 7, maxPosts = 5, publish = false } = req.body;

    const posts = await rssCollector.collectPosts({
      keywords,
      days,
      maxPosts,
      includeSourceLink: true,
    });

    const publishablePosts = posts.filter((post) => getPostQualityIssues(post).length === 0);

    if (publishablePosts.length === 0) {
      return res.json({
        success: true,
        collected: posts.length,
        published: 0,
        message: 'No publishable posts were found.',
      });
    }

    if (!publish) {
      return res.json({
        success: true,
        collected: posts.length,
        published: 0,
        posts: publishablePosts,
      });
    }

    const results: Array<{ post: Post; success: boolean; url?: string; error?: string }> = [];

    for (const post of publishablePosts) {
      if (post.sourceUrl && await db.existsByUrl(post.sourceUrl)) {
        results.push({ post, success: false, error: 'duplicate-source-url' });
        continue;
      }

      const result = await wpClient.publishPost({
        ...post,
        status: 'publish',
      });

      if (!result.success) {
        results.push({ post, success: false, error: result.error });
        continue;
      }

      const savedPost = await db.savePost({
        ...post,
        status: 'publish',
        wordpressId: result.postId,
        wordpressUrl: result.postUrl,
        publishedAt: new Date(),
      });

      results.push({ post: savedPost, success: true, url: result.postUrl });
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const publishedCount = results.filter((entry) => entry.success).length;

    return res.json({
      success: true,
      collected: posts.length,
      published: publishedCount,
      results,
    });
  } catch (error) {
    console.error('[API] RSS publish error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/publish/manual', async (req: Request, res: Response) => {
  try {
    const { title, content, categories, tags, status = 'draft' } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'title and content are required' });
    }

    const post: Post = {
      title,
      content: sanitizeHtmlFragment(content),
      categories,
      tags,
      status,
      createdAt: new Date(),
      source: 'manual',
    };

    const qualityIssues = getPostQualityIssues(post);
    if (qualityIssues.length > 0) {
      return res.status(422).json({
        success: false,
        error: 'Manual content did not pass quality checks',
        issues: qualityIssues,
      });
    }

    const result = await wpClient.publishPost(post);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

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
  } catch (error) {
    console.error('[API] Manual publish error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/schedule', (req: Request, res: Response) => {
  res.json({
    enabled: config.scheduler.enabled,
    defaultCron: config.scheduler.cron,
    mode: config.scheduler.mode,
    triggerProtected: Boolean(config.scheduler.triggerToken),
    jobs: scheduler.getAllJobStatus(),
  });
});

app.post('/api/schedule/run', async (req: Request, res: Response) => {
  if (!isAuthorizedScheduleTrigger(req)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized schedule trigger',
    });
  }

  try {
    const { mode = 'both' } = req.body;

    if (mode === 'ai' || mode === 'both') {
      await scheduler.publishAIPost({ topic: 'Automated AI article' });
    }

    if (mode === 'rss' || mode === 'both') {
      await scheduler.publishRSSPosts();
    }

    return res.json({ success: true, message: 'Schedule run complete' });
  } catch (error) {
    console.error('[API] Schedule run error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.delete('/api/posts/:id', async (req: Request, res: Response) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const post = await db.getPostById(id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const deleted = await db.deletePost(id);
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete post' });
    }

    return res.json({ success: true, message: 'Post deleted' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete post' });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error',
  });
});

const PORT = config.server.port;

async function startServer() {
  try {
    await db.initialize();
    console.log('[Server] Database initialized');

    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('AI Automator Blog Server started');
      console.log('='.repeat(50));
      console.log(`Port: ${PORT}`);
      console.log(`Environment: ${config.server.nodeEnv}`);
      console.log(`Supabase connected`);
      console.log(`Scheduler: ${config.scheduler.enabled ? 'enabled' : 'disabled'}`);
      console.log('='.repeat(50));

      validateConfig();

      if (config.scheduler.enabled) {
        scheduler.startDefaultSchedule();
      }
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  scheduler.stopAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Server] Shutting down...');
  scheduler.stopAll();
  process.exit(0);
});
