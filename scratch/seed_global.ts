/**
 * scratch/seed_global.ts
 * Global English Seeding Script for AI Automator Lab
 */

import { PostDatabase } from '../src/db/database';
import { aiGenerator } from '../src/groq/generator';
import { AIGenerationConfig } from '../src/types';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedGlobal() {
  console.log('🌍 Initializing Global Market Launch...');
  const db = new PostDatabase();

  try {
    // 0. Initialize Database
    await db.initialize();

    // 1. Clear existing posts (Fresh Start for Global)
    console.log('🧹 Cleaning up old content for a fresh start...');
    const existingPosts = await db.getPosts();
    for (const post of existingPosts) {
      if (post.id) {
        await db.deletePost(Number(post.id));
      }
    }
    console.log('✅ DB cleanup complete.');

    // 2. Define Global Trending Topics
    const globalConfigs: AIGenerationConfig[] = [
      {
        topic: 'The Rise of Vertical AI Agents in 2026',
        keywords: ['Specialized AI', 'Agentic Workflows', 'Vertical SaaS', 'Business Automation'],
        tone: 'formal',
        length: 'medium'
      },
      {
        topic: 'Monetizing AI: Strategic Pillars for Solo Entrepreneurs',
        keywords: ['One-person Business', 'AI Monetization', 'Digital Assets', 'Scaling with AI'],
        tone: 'formal',
        length: 'medium'
      },
      {
        topic: 'Why Privacy-First AI is the Ultimate Competitive Advantage',
        keywords: ['Local LLMs', 'Data Sovereignty', 'AI Ethics', 'Enterprise Security'],
        tone: 'formal',
        length: 'medium'
      }
    ];

    // 3. Generate and Store Global Posts
    console.log('🧠 AI Writer is generating original global content... (This may take a minute)');
    const globalPosts = await aiGenerator.generateMultiplePosts(globalConfigs);

    for (const post of globalPosts) {
      const savedPost = await db.savePost(post);
      console.log(`✨ Published: "${savedPost.title}" (ID: ${savedPost.id})`);
    }

    console.log('\n🚀 GLOBAL LAUNCH READY!');
    console.log('Visit http://localhost:5173 to see your international magazine.');

  } catch (error) {
    console.error('❌ Global seeding failed:', error);
  }
}

seedGlobal();
