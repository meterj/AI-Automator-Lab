import { aiGenerator } from '../src/groq/generator';
import { db } from '../src/db/database';
import { Post } from '../src/types';

async function seedContent() {
  console.log('🌱 초기 킬러 콘텐츠 시딩 시작 (Clean-up 포함)...');
  
  try {
    // 1. DB 초기화
    await db.initialize();
    
    // 2. 기존 데이터 삭제 (청소)
    console.log('🧹 기존 데이터 청소 중...');
    const existingPosts = await db.getPosts({ limit: 100 });
    for (const p of existingPosts) {
      if (p.id) {
        await db.deletePost(p.id);
        console.log(`- 삭제됨: ID ${p.id}`);
      }
    }
    console.log('✅ 청소 완료. 새로운 데이터를 생성합니다.');

    const topics = [
      {
        topic: '2026 AI Agent Revolution: Operating a One-Person Business with AI Agents',
        keywords: ['AI Agent', 'Automation', 'One-person business', 'Efficiency'],
        tone: 'formal' as const
      },
      {
        topic: 'Build Your Own AI News Curator Blog Without Coding',
        keywords: ['No-code', 'AI Curator', 'WordPress', 'Automation'],
        tone: 'friendly' as const
      },
      {
        topic: 'Top 7 Essential AI Tool Stack for 300% Productivity in 2026',
        keywords: ['Productivity', 'AI Tools', 'Workflow', 'Efficiency'],
        tone: 'casual' as const
      }
    ];

    for (const item of topics) {
      console.log(`🚀 기사 생성 중: ${item.topic}...`);
      
      try {
        const generated = await aiGenerator.generatePost({
          topic: item.topic,
          keywords: item.keywords,
          tone: item.tone,
          length: 'short'
        });

        const post: Post = {
          title: generated.title,
          content: generated.content,
          excerpt: generated.excerpt,
          status: 'publish',
          source: 'ai',
          createdAt: new Date(),
          publishedAt: new Date()
        };

        const saved = await db.savePost(post);
        console.log(`✅ Supabase 저장 완료 (ID: ${saved.id}): ${saved.title}`);
        
        // Rate limit(429) 방지를 위한 지연
        if (topics.indexOf(item) < topics.length - 1) {
          console.log('⏳ 다음 요청 전 대기 중 (40초)...');
          await new Promise(resolve => setTimeout(resolve, 40000));
        }
      } catch (err: any) {
        if (err.response?.status === 429) {
          console.error('⚠️ Rate Limit 발생. 잠시 후 다시 시도해 주세요.');
          break;
        }
        console.error('❌ 개별 기사 생성 실패:', err.message);
      }
    }

    console.log('\n🏁 모든 초기 데이터 시딩이 완료되었습니다!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 시딩 실패:', error);
    process.exit(1);
  }
}

seedContent();
