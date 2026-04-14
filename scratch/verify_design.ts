import { aiGenerator } from '../src/groq/generator';
import { config } from '../src/config';
import * as fs from 'fs';

async function verifyDesign() {
  console.log('🎨 디자인 검증 시작...');
  
  try {
    const testConfig = {
      topic: 'Premium Music Genre Analysis: Taryeong Pop',
      keywords: ['Taryeong', 'Pop', 'Modern Fusion', 'Korean Traditional'],
      tone: 'formal' as const,
      length: 'medium' as const,
    };

    console.log('🚀 AI 글 생성 중 (이 과정은 시간이 조금 걸릴 수 있습니다)...');
    const post = await aiGenerator.generatePost(testConfig);

    console.log('\n✨ 생성된 제목:', post.title);
    
    const outputPath = './scratch/preview_post.html';
    
    // 워드프레스 테마 환경을 흉내내기 위한 기본 래핑
    const previewHtml = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Design Preview - ${post.title}</title>
        <style>
          body { background: #f5f6fa; padding: 50px 20px; }
          .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 900px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${post.title}</h1>
          <hr>
          ${post.content}
        </div>
      </body>
      </html>
    `;

    fs.writeFileSync(outputPath, previewHtml);
    console.log(`\n✅ 프리뷰 파일 생성 완료: ${outputPath}`);
    console.log('\n--- 본문 HTML 미리보기 (일부) ---');
    console.log(post.content.substring(0, 500) + '...');
    
  } catch (error: any) {
    if (error.response) {
      console.error('❌ Groq API 오류:', error.response.status, error.response.data);
    } else {
      console.error('❌ 검증 실패:', error.message);
    }
  }
}

verifyDesign();
