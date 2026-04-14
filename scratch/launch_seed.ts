/**
 * scratch/launch_seed.ts
 * "AI Automator Lab" 공식 런칭 기념 기획 기사 시딩 스크립트
 */

import { PostDatabase } from '../src/db/database';
import { aiGenerator } from '../src/groq/generator';
import { AIGenerationConfig } from '../src/types';
import * as dotenv from 'dotenv';

dotenv.config();

async function launchSeed() {
  console.log('🚀 Final Launch Seeding Started...');
  const db = new PostDatabase();
  await db.initialize();

  const launchTopics = [
    {
      topic: "The Future of Multi-Agent Systems in Enterprise",
      keywords: ["AI Agents", "Autonomous Systems", "Enterprise Logic", "Multi-Agent Workflows"]
    },
    {
      topic: "How Generative AI is Redefining Creative Workflows",
      keywords: ["Generative Art", "Creative AI", "Design Automation", "Content Strategy"]
    },
    {
      topic: "The Rise of Local LLMs and Data Privacy Sovereignty",
      keywords: ["Edge AI", "Data Privacy", "Local Models", "Private AI Infrastructure"]
    },
    {
      topic: "No-Code AI Automation: Empowering Solo Entrepreneurs",
      keywords: ["Solo-preneurship", "No-code AI", "Business Scaling", "Automated Operations"]
    },
    {
      topic: "Predictive Analytics: AI-Driven Insights for Global Markets",
      keywords: ["Market Analytics", "Predictive Modeling", "Big Data AI", "Economic Trends"]
    },
    {
      topic: "Ethical AI Frameworks: Navigating the Next Tech Frontier",
      keywords: ["AI Ethics", "Trusted AI", "Responsible Innovation", "Policy Frameworks"]
    }
  ];

  console.log(`🧠 AI Columnist is writing ${launchTopics.length} premium articles...`);

  for (const item of launchTopics) {
    try {
      const config: AIGenerationConfig = {
        topic: item.topic,
        keywords: item.keywords,
        tone: 'formal',
        length: 'medium'
      };

      const post = await aiGenerator.generatePost(config);
      const savedPost = await db.savePost(post);
      console.log(`✅ Successfully Seeded: "${savedPost.title}"`);
      
      // Rate limit protection
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(`❌ Failed to seed topic "${item.topic}":`, error);
    }
  }

  console.log('\n✨ ALL BASE ARTICLES PUBLISHED SUCCESSFULLY!');
  console.log('Your blog is now officially populated with premium content.');
}

launchSeed();
