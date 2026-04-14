const https = require('follow-redirects').https;
const fs = require('fs');

const postData = JSON.stringify({
  topic: '인공지능의 미래',
  keywords: ['AI', '기술', '트렌드'],
  tone: 'friendly',
  length: 'short'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/posts/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('--- 응답 ---');
    console.log('상태 코드:', res.statusCode);
    console.log('응답 데이터:', data);
    console.log('---');

    if (res.statusCode === 200) {
      const json = JSON.parse(data);
      console.log('\n✅ 게시글 생성 성공!');
      console.log('\n📌 제목:', json.title);
      console.log('📝 내용:', json.content);
      console.log('🏷️  태그:', json.keywords);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 요청 실패:', error.message);
});

req.write(postData);
req.end();