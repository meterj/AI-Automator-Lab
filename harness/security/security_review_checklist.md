# security_review_checklist.md

## 보안 검토 결과 (2026-04-14)

### 1. 프롬프트 인젝션 시나리오 점검
- [x] 점검 완료
- **위험**: OpenAI API 호출 시 사용자 입력이 프롬프트에 직접 포함됨
- **완화**: 
  - `src/openai/generator.ts`에서 topic, keywords 등은 이스케이프 처리 필요
  - 시스템 프롬프트에서 명확한 역할 정의
- **조치**: 기본적인 프롬프트 구조 유지, 추후 강화 필요 시 이스케이프 추가

### 2. 민감정보 출력 가능성 점검
- [x] 점검 완료
- **위험**: API 키, WordPress 비밀번호 등이 노출될 수 있음
- **완화**:
  - `.env` 파일은 `.gitignore`에 포함
  - `.env.example`은 더미 값 사용
  - API 응답에 API 키 미포함
- **조치**: 로그에 민감정보 출력하지 않도록 처리됨

### 3. 허용 범위 밖 파일/시스템 접근 확인
- [x] 확인 완료
- **위험**: 없음
- **조치**: 
  - 데이터베이스는 지정된 경로(`./data/posts.db`)에만 생성
  - 파일 시스템 접근은 `better-sqlite3` 라이브러리로 제한

### 4. 승인 없는 파괴적 작업 확인
- [x] 확인 완료
- **위험**: API 엔드포인트에 인증 없이 접근 가능
- **완화 필요**:
  - `/api/posts/:id` DELETE 엔드포인트에 인증 필요
  - `/api/publish/*` 엔드포인트에 인증 필요
- **조치**: 추후 API 키 또는 JWT 인증 추가 권장

### 5. 로그에 민감정보 확인
- [x] 확인 완료
- **위험**: 없음
- **조치**: 
  - `console.log`에 API 키, 비밀번호 출력하지 않음
  - WordPress API 오류 시 상세 내용은 로그에만 출력

---

## 추가 보안 권장사항

### 1. API 인증 (권장)
```typescript
// 추후 추가할 미들웨어 예시
import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ error: '인증 필요' });
  }
  next();
}
```

### 2. Rate Limiting (권장)
```bash
npm install express-rate-limit
```

### 3. 프로덕션 배포 시
- HTTPS 필수
- 환경 변수는 안전한 비밀 관리 시스템 사용 (AWS Secrets Manager, 환경 변수 등)
- 로그는 민감정보 없이 저장
- 정기적인 의존성 보안 업데이트

---

## 체크리스트 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| 프롬프트 인젝션 | ✅ | 기본 구조 OK, 추후 강화 권장 |
| 민감정보 출력 | ✅ | .env 분리, 로그에서 제외 |
| 파일 접근 | ✅ | 제한된 경로만 사용 |
| 파괴적 작업 | ⚠️ | 인증 없음, 추후 API 키 추가 권장 |
| 로그 보안 | ✅ | 민감정보 미출력 |