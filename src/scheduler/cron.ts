// src/scheduler/cron.ts - 스케줄러

import cron from 'node-cron';
import { config, validateConfig } from '../config';
import { wpClient } from '../wordpress/client';
import { aiGenerator } from '../openai/generator';
import { rssCollector } from '../rss/parser';
import { db } from '../db/database';
import { AIGenerationConfig, Post } from '../types';

interface ScheduledJob {
  id: string;
  cron: string;
  enabled: boolean;
  mode: 'ai' | 'rss' | 'both';
  config?: AIGenerationConfig;
  rssFilter?: {
    keywords?: string[];
    days?: number;
  };
}

class BlogScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private jobConfigs: Map<string, ScheduledJob> = new Map();

  /**
   * AI 글 생성 및 발행
   */
  async publishAIPost(config: AIGenerationConfig): Promise<void> {
    console.log(`[AI] 글 생성 시작: ${config.topic}`);
    
    try {
      const post = await aiGenerator.generatePost(config);
      const result = await wpClient.publishPost(post);
      
      if (result.success) {
        // DB에 저장
        const savedPost = await db.savePost({
          ...post,
          wordpressId: result.postId,
          wordpressUrl: result.postUrl,
          publishedAt: new Date(),
        });
        
        console.log(`[AI] 발행 완료: "${savedPost.title}" → ${result.postUrl}`);
      } else {
        console.error(`[AI] 발행 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('[AI] 글 생성/발행 오류:', error);
    }
  }

  /**
   * RSS 글 수집 및 발행
   */
  async publishRSSPosts(options?: {
    keywords?: string[];
    days?: number;
    maxPosts?: number;
  }): Promise<void> {
    console.log('[RSS] 글 수집 시작');
    
    try {
      const posts = await rssCollector.collectPosts({
        ...options,
        includeSourceLink: true,
        maxPosts: options?.maxPosts || 5,
      });
      
      console.log(`[RSS] ${posts.length}개 글 수집됨`);
      
      for (const post of posts) {
        // 중복 체크
        if (post.sourceUrl && await db.existsByUrl(post.sourceUrl)) {
          console.log(`[RSS] 이미 발행된 글 스킵: ${post.title}`);
          continue;
        }
        
        const result = await wpClient.publishPost(post);
        
        if (result.success) {
          const savedPost = await db.savePost({
            ...post,
            wordpressId: result.postId,
            wordpressUrl: result.postUrl,
            publishedAt: new Date(),
          });
          
          console.log(`[RSS] 발행 완료: "${savedPost.title}" → ${result.postUrl}`);
        } else {
          console.error(`[RSS] 발행 실패: ${result.error}`);
        }
        
        // API 속도 제한 고려
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('[RSS] 수집/발행 오류:', error);
    }
  }

  /**
   * 스케줄 잡 추가
   */
  addJob(job: ScheduledJob): void {
    if (!cron.validate(job.cron)) {
      throw new Error(`잘못된 cron 표현식: ${job.cron}`);
    }

    const task = cron.schedule(job.cron, async () => {
      console.log(`[스케줄러] ${job.id} 실행 시작 (${job.mode})`);
      
      switch (job.mode) {
        case 'ai':
          if (job.config) {
            await this.publishAIPost(job.config);
          }
          break;
          
        case 'rss':
          await this.publishRSSPosts(job.rssFilter);
          break;
          
        case 'both':
          if (job.config) {
            await this.publishAIPost(job.config);
          }
          await this.publishRSSPosts(job.rssFilter);
          break;
      }
    });

    this.jobs.set(job.id, task);
    this.jobConfigs.set(job.id, job);
    
    console.log(`[스케줄러] ${job.id} 등록됨 (${job.cron})`);
  }

  /**
   * 스케줄 잡 제거
   */
  removeJob(id: string): void {
    const task = this.jobs.get(id);
    if (task) {
      task.stop();
      this.jobs.delete(id);
      this.jobConfigs.delete(id);
      console.log(`[스케줄러] ${id} 제거됨`);
    }
  }

  /**
   * 모든 잡 중지
   */
  stopAll(): void {
    for (const [id, task] of this.jobs) {
      task.stop();
      console.log(`[스케줄러] ${id} 중지됨`);
    }
  }

  /**
   * 잡 상태 조회
   */
  getJobStatus(id: string): ScheduledJob | undefined {
    return this.jobConfigs.get(id);
  }

  /**
   * 모든 잡 상태 조회
   */
  getAllJobStatus(): ScheduledJob[] {
    return Array.from(this.jobConfigs.values());
  }

  /**
   * 기본 스케줄 시작
   */
  startDefaultSchedule(): void {
    const scheduleConfig = config.scheduler;
    
    if (!scheduleConfig.enabled) {
      console.log('[스케줄러] 비활성화됨');
      return;
    }

    this.addJob({
      id: 'default-schedule',
      cron: scheduleConfig.cron,
      enabled: true,
      mode: scheduleConfig.mode,
    });
    
    console.log(`[스케줄러] 기본 스케줄 시작: ${scheduleConfig.cron} (${scheduleConfig.mode})`);
  }
}

// 싱글톤 인스턴스
export const scheduler = new BlogScheduler();