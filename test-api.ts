import axios from 'axios';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

const API_URL = 'http://localhost:3000/api';

console.log('🧪 API 테스트 시작...\n');

// 1. Health Check
async function testHealth() {
  try {
    const response = await axios.get(`${API_URL}/health`);
    console.log('✅ Health Check:', response.data);
  } catch (error: any) {
    console.log('❌ Health Check 실패:', error.message);
  }
}

// 2. Get Posts
async function testGetPosts() {
  try {
    const response = await axios.get(`${API_URL}/posts`);
    console.log('✅ Posts 조회:', response.data);
  } catch (error: any) {
    console.log('❌ Posts 조회 실패:', error.message);
  }
}

// 3. AI 게시글 생성 (단건)
async function testCreatePost() {
  try {
    const topic = '인공지능과 머신러닝의 미래';

    const response = await axios.post(`${API_URL}/posts`, {
      topic,
      keywords: ['AI', '머신러닝', '딥러닝'],
      tone: 'casual',
      length: 'medium'
    });

    console.log('✅ AI 게시글 생성 성공:', response.data);
  } catch (error: any) {
    if (error.response) {
      console.log('❌ AI 게시글 생성 실패:', error.response.data);
    } else {
      console.log('❌ AI 게시글 생성 실패:', error.message);
    }
  }
}

// 4. AI 게시글 생성 (배치)
async function testBatchGeneratePosts() {
  try {
    const topics = [
      '쿠퍼티노의 새로운 기술',
      '워드프레스의 활용 방법',
      '오픈소스의 중요성'
    ];

    for (const topic of topics) {
      console.log(`🚀 게시글 생성 중: ${topic}...`);

      const response = await axios.post(`${API_URL}/posts/generate`, {
        topic,
        keywords: ['기술', '개발', '트렌드'],
        tone: 'friendly',
        length: 'short'
      });

      console.log(`✅ 생성 완료:`, response.data.title.substring(0, 30) + '...');
    }
  } catch (error: any) {
    if (error.response) {
      console.log('❌ 배치 생성 실패:', error.response.data);
    } else {
      console.log('❌ 배치 생성 실패:', error.message);
    }
  }
}

// 5. Statistics
async function testStats() {
  try {
    const response = await axios.get(`${API_URL}/stats`);
    console.log('✅ Statistics:', response.data);
  } catch (error: any) {
    console.log('❌ Statistics 조회 실패:', error.message);
  }
}

// 테스트 실행
async function runTests() {
  console.log('=== API 테스트 ===\n');

  await testHealth();

  console.log('\n--- 게시글 목록 ---');
  await testGetPosts();

  console.log('\n--- 통계 정보 ---');
  await testStats();

  console.log('\n--- AI 게시글 생성 (단건) ---');
  await testCreatePost();

  console.log('\n--- AI 게시글 생성 (배치) ---');
  await testBatchGeneratePosts();

  console.log('\n=== 테스트 완료 ===');
}

runTests().catch(console.error);