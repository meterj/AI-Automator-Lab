import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:3000/api';

try {
  console.log('🧪 테스트 시작...\n');

  // AI 게시글 생성 테스트
  console.log('🚀 AI 게시글 생성 테스트...\n');

  const response = await axios.post(`${API_URL}/posts/generate`, {
    topic: '인공지능의 미래',
    keywords: ['AI', '기술', '트렌드'],
    tone: 'friendly',
    length: 'short'
  });

  console.log('✅ 생성 성공:', response.data);
  console.log('\n📄 게시글 내용:', response.data.content);
  console.log('\n🏷️  태그:', response.data.keywords);
  console.log('\n📝 제목:', response.data.title);

  console.log('\n\n✅ 테스트 완료!');
} catch (error: any) {
  console.error('❌ 테스트 실패:', error.response?.data || error.message);
}