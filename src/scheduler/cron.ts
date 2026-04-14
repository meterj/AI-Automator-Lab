// src/scheduler/cron.ts - Enhanced Intelligent Scheduler

import cron from 'node-cron';
import { config } from '../config';
import { aiGenerator } from '../groq/generator';
import { db } from '../db/database';
import { AIGenerationConfig } from '../types';

// Global AI & Automation Topic Rotation List (Professional Selection)
const GLOBAL_AI_TOPICS = [
  "The Future of Multi-Agent Systems in Enterprise",
  "How Generative AI is Redefining Creative Workflows",
  "The Rise of Local LLMs and Data Privacy Sovereignty",
  "No-Code AI Automation: Empowering Solo Entrepreneurs",
  "AI-Driven Predictive Analytics for Global Markets",
  "The Ethical Implications of Human-AI Collaboration",
  "Personalized AI Tutors: The Revolution in Education",
  "Automating the Unautomatable: AI in Heavy Industry",
  "Sustainable AI: The Quest for Energy-Efficient Models",
  "Real-Time Translation & The End of Language Barriers"
];

class BlogScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  async publishAIPost(config: AIGenerationConfig): Promise<void> {
    console.log(`[AI-Scheduler] Generating Article: ${config.topic}`);
    try {
      const post = await aiGenerator.generatePost(config);
      const savedPost = await db.savePost(post);
      console.log(`[AI-Scheduler] Successfully Published: "${savedPost.title}" (ID: ${savedPost.id})`);
    } catch (error) {
      console.error('[AI-Scheduler] Generation Error:', error);
    }
  }

  startDefaultSchedule(): void {
    const scheduleConfig = config.scheduler;
    if (!scheduleConfig.enabled) {
      console.log('[Scheduler] Disabled in configuration.');
      return;
    }

    // Daily Intelligent Posting Job
    cron.schedule(scheduleConfig.cron, async () => {
      console.log('[Scheduler] Daily Intelligent Task Triggered');
      
      // Select topic based on the day of the year (Rotation)
      const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      const topicIndex = dayOfYear % GLOBAL_AI_TOPICS.length;
      const selectedTopic = GLOBAL_AI_TOPICS[topicIndex];

      const genConfig: AIGenerationConfig = {
        topic: selectedTopic,
        keywords: ["Future Trends", "Industry Insight", "Strategic Analysis"],
        tone: 'formal',
        length: 'medium'
      };

      await this.publishAIPost(genConfig);
    });

    console.log(`[Scheduler] Active: ${scheduleConfig.cron} (Topic Rotation Mode)`);
  }

  stopAll(): void {
    for (const task of this.jobs.values()) {
      task.stop();
    }
    this.jobs.clear();
  }
}

export const scheduler = new BlogScheduler();