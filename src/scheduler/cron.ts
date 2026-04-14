import cron from 'node-cron';
import { config } from '../config';
import { aiGenerator } from '../groq/generator';
import { rssCollector } from '../rss/parser';
import { db } from '../db/database';
import { AIGenerationConfig } from '../types';
import { getPostQualityIssues, isPostPublishable } from '../content/quality';

const GLOBAL_AI_TOPICS = [
  'The Future of Multi-Agent Systems in Enterprise',
  'How Generative AI is Redefining Creative Workflows',
  'The Rise of Local LLMs and Data Privacy Sovereignty',
  'No-Code AI Automation: Empowering Solo Entrepreneurs',
  'AI-Driven Predictive Analytics for Global Markets',
  'The Ethical Implications of Human-AI Collaboration',
  'Personalized AI Tutors: The Revolution in Education',
  'Automating the Unautomatable: AI in Heavy Industry',
  'Sustainable AI: The Quest for Energy-Efficient Models',
  'Real-Time Translation and the End of Language Barriers'
];

class BlogScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  async publishAIPost(generationConfig: AIGenerationConfig): Promise<void> {
    console.log(`[AI-Scheduler] Generating article: ${generationConfig.topic}`);

    try {
      const post = await aiGenerator.generatePost(generationConfig);
      const qualityIssues = getPostQualityIssues(post);

      if (qualityIssues.length > 0) {
        console.warn(`[AI-Scheduler] Skipped low-quality post: ${qualityIssues.join(', ')}`);
        return;
      }

      const savedPost = await db.savePost(post);
      console.log(`[AI-Scheduler] Saved "${savedPost.title}" (ID: ${savedPost.id})`);
    } catch (error) {
      console.error('[AI-Scheduler] Generation error:', error);
    }
  }

  async publishRSSPosts(options?: {
    keywords?: string[];
    days?: number;
    maxPosts?: number;
  }): Promise<void> {
    console.log('[RSS-Scheduler] Collecting latest feed items');

    try {
      const posts = await rssCollector.collectPosts({
        keywords: options?.keywords,
        days: options?.days ?? 1,
        maxPosts: options?.maxPosts ?? 3,
        includeSourceLink: true,
      });

      let savedCount = 0;

      for (const post of posts) {
        if (post.sourceUrl && await db.existsByUrl(post.sourceUrl)) {
          continue;
        }

        if (!isPostPublishable(post)) {
          console.warn(`[RSS-Scheduler] Skipped low-quality post: ${post.title}`);
          continue;
        }

        await db.savePost({
          ...post,
          status: 'publish',
          publishedAt: new Date(),
        });
        savedCount += 1;
      }

      console.log(`[RSS-Scheduler] Saved ${savedCount} new RSS post(s)`);
    } catch (error) {
      console.error('[RSS-Scheduler] Collection error:', error);
    }
  }

  getAllJobStatus(): Array<{ name: string; running: boolean }> {
    return Array.from(this.jobs.entries()).map(([name, task]) => ({
      name,
      running: Boolean(task),
    }));
  }

  startDefaultSchedule(): void {
    if (!config.scheduler.enabled) {
      console.log('[Scheduler] Disabled in configuration.');
      return;
    }

    if (this.jobs.has('default')) {
      return;
    }

    const task = cron.schedule(config.scheduler.cron, async () => {
      console.log(`[Scheduler] Triggered in mode: ${config.scheduler.mode}`);

      if (config.scheduler.mode === 'rss' || config.scheduler.mode === 'both') {
        await this.publishRSSPosts();
      }

      if (config.scheduler.mode === 'ai' || config.scheduler.mode === 'both') {
        const dayOfYear = Math.floor(
          (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
        );
        const selectedTopic = GLOBAL_AI_TOPICS[dayOfYear % GLOBAL_AI_TOPICS.length];

        await this.publishAIPost({
          topic: selectedTopic,
          keywords: ['Future Trends', 'Industry Insight', 'Strategic Analysis'],
          tone: 'formal',
          length: 'medium',
        });
      }
    }, {
      timezone: 'Asia/Seoul',
    });

    this.jobs.set('default', task);
    console.log(`[Scheduler] Active: ${config.scheduler.cron} (mode: ${config.scheduler.mode}, timezone: Asia/Seoul)`);
  }

  stopAll(): void {
    for (const task of this.jobs.values()) {
      task.stop();
    }

    this.jobs.clear();
  }
}

export const scheduler = new BlogScheduler();
