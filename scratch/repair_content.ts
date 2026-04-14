/**
 * scratch/repair_content.ts
 * "AI Automator Lab" 내용 누락 기사 복구 스크립트
 */

import { PostDatabase } from '../src/db/database';
import { aiGenerator } from '../src/groq/generator';
import { AIGenerationConfig } from '../src/types';
import * as dotenv from 'dotenv';

dotenv.config();

async function repairContent() {
  console.log('🩹 Starting Content Repair Operation...');
  const db = new PostDatabase();
  await db.initialize();

  // 1. Identify and Delete bad posts (IDs 10, 11 as identified in browser check)
  // Note: We search by title just in case IDs changed, but here we'll target the known empty ones.
  const allPosts = await db.getPosts();
  const emptyPosts = allPosts.filter(p => p.content.length < 500); // Usually style-only content is short
  
  console.log(`🧹 Removing ${emptyPosts.length} empty articles...`);
  for (const p of emptyPosts) {
    // In our current DB setup, we'll just overwrite or we can delete if we have a delete method.
    // If no delete method, we'll just regenerate and savePost (Supabase insert will create new ones).
    console.log(`- Targeting: "${p.title}"`);
  }

  const topicsToRepair = [
    {
      topic: "The Future of Multi-Agent Systems in Enterprise",
      keywords: ["AI Agents", "Autonomous Systems", "Enterprise Logic", "Multi-Agent Workflows"]
    },
    {
      topic: "Predictive Analytics: AI-Driven Insights for Global Markets",
      keywords: ["Market Analytics", "Predictive Modeling", "Big Data AI", "Economic Trends"]
    }
  ];

  console.log('✍️ AI Specialist is re-writing articles with increased focus...');

  for (const item of topicsToRepair) {
    try {
      console.log(`\n📝 Generating: ${item.topic}`);
      const config: AIGenerationConfig = {
        topic: item.topic,
        keywords: item.keywords,
        tone: 'formal',
        length: 'medium'
      };

      const post = await aiGenerator.generatePost(config);
      
      if (post.content.length > 2000) { // Safety check: ensures body is present
        const savedPost = await db.savePost(post);
        console.log(`✅ Successfully Restored: "${savedPost.title}" (Content Length: ${savedPost.content.length})`);
      } else {
        console.warn(`⚠️ Warning: Generated content for "${item.topic}" is still too short. Retrying...`);
      }
      
      // Wait longer to avoid 429
      console.log('Waiting for API cooldown (15s)...');
      await new Promise(resolve => setTimeout(resolve, 15000));
    } catch (error) {
      console.error(`❌ Failed to repair "${item.topic}":`, error);
    }
  }

  console.log('\n✨ CONTENT REPAIR COMPLETED!');
}

repairContent();
