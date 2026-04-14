# implementation_plan.md

## 1. 목표 정의
- 문제: 네이버 블로그 API가 종료되어 자동 포스팅 불가능
- 원하는 결과: WordPress.com 블로그에 AI 생성 글 또는 RSS 수집 글을 자동으로 포스팅
- 비즈니스 가치: 블로그 콘텐츠 자동화로 시간 절약, 꾸준한 글 발행

## 2. 범위
### 포함
- Express + TypeScript API 서버
- WordPress.com REST API 연동
- OpenAI API 글 자동 생성
- RSS 피드 수집 및 포스팅
- node-cron 스케줄러
- 환경 변수 기반 설정 (.env)
- 글 이력 관리 (SQLite)

### 제외
- 관리자 UI (나중에 추가 가능)
- 멀티 블로그 지원 (초기 버전)
- 이미지 자동 생성/업로드 (나중에 추가 가능)

## 3. 입력 문맥
- 참고 문서:
  - WordPress.com REST API: https://developer.wordpress.com/docs/api/
  - OpenAI API: https://platform.openai.com/docs
- 참고 코드: harness/templates (해당 없음)
- 외부 의존성:
  - express, typescript, ts-node
  - openai (npm)
  - rss-parser (npm)
  - node-cron (npm)
  - better-sqlite3 (npm)
  - dotenv (npm)
- 최신성 요구: OpenAI API는 최신 버전 사용

## 4. 작업 분해

### Task 1: 프로젝트 초기화
- 목적: 개발 환경 설정
- 입력: 없음
- 출력: package.json, tsconfig.json, .env.example, 폴더 구조
- 완료 조건: npm install 완료, TypeScript 컴파일 성공
- 실패 조건: 의존성 설치 실패

### Task 2: 환경 설정 모듈
- 목적: API 키, 블로그 URL 등 설정 관리
- 입력: .env 파일
- 출력: config.ts (설정 객체)
- 완료 조건: 환경 변수 로드 성공, 검증 로직 동작
- 실패 조건: 필수 환경 변수 누락

### Task 3: WordPress API 연동
- 목적: WordPress.com REST API로 글 발행
- 입력: 글 제목, 내용, 카테고리 등
- 출력: 포스팅 결과 (글 ID, URL)
- 완료 조건: 테스트 글 발행 성공
- 실패 조건: 인증 실패, API 호출 실패

### Task 4: OpenAI 글 생성
- 목적: AI로 블로그 글 자동 생성
- 입력: 주제, 키워드, 스타일 설정
- 출력: 생성된 글 (제목 + 내용)
- 완료 조건: 자연스러운 한국어 글 생성
- 실패 조건: API 호출 실패, 글 품질 저하

### Task 5: RSS 수집
- 목적: 외부 RSS 피드에서 글 수집
- 입력: RSS URL 목록
- 출력: 파싱된 글 목록
- 완료 조건: RSS 파싱 성공, 글 추출 완료
- 실패 조건: RSS URL 무효, 파싱 실패

### Task 6: 스케줄러
- 목적: 정해진 시간에 자동 포스팅
- 입력: cron 스케줄 설정
- 출력: 스케줄에 따른 자동 실행
- 완료 조건: 지정 시간에 포스팅 실행
- 실패 조건: 스케줄 작동 실패

### Task 7: 데이터베이스 (SQLite)
- 목적: 발행 이력 관리
- 입력: 발행된 글 정보
- 출력: 발행 이력 조회, 중복 방지
- 완료 조건: 글 저장/조회 성공
- 실패 조건: DB 연결 실패

### Task 8: API 서버 (Express)
- 목적: 수동 실행 엔드포인트 제공
- 입력: HTTP 요청
- 출력: API 응답 (JSON)
- 완료 조건: POST /api/publish, GET /api/posts 동작
- 실패 조건: 서버 시작 실패

## 5. 위험 분석
- 위험 요소: WordPress API 토큰 만료, OpenAI API 비용
- 영향도: Medium
- 완화 전략: 토큰 갱신 로직, API 호출 제한 설정

## 6. 검증 계획
- 형식 검증: TypeScript 컴파일, ESLint 통과
- 기능 검증: 각 모듈 단위 테스트
- 보안 검증: security_review_checklist.md 체크
- UI 검증: 해당 없음
- 회귀 검증: 기존 기능 동작 확인

## 7. 롤백 계획
- 롤백 지점: 각 Task 완료 후 commit
- 롤백 절차: git checkout으로 이전 버전 복구

## 8. 승인 필요 여부
- 아니오 (사용자가 이미 워드프레스로 진행 동의)

## 9. 프로젝트 구조
```
blog/
├── harness/              # 기존 harness
├── src/
│   ├── index.ts          # 서버 진입점
│   ├── config.ts         # 환경 설정
│   ├── wordpress/
│   │   └── client.ts     # WordPress API 클라이언트
│   ├── openai/
│   │   └── generator.ts  # OpenAI 글 생성
│   ├── rss/
│   │   └── parser.ts     # RSS 수집
│   ├── scheduler/
│   │   └── cron.ts       # 스케줄러
│   ├── db/
│   │   └── database.ts   # SQLite 연동
│   └── types/
│       └── index.ts      # 타입 정의
├── .env                  # 환경 변수 (gitignore)
├── .env.example          # 환경 변수 예시
├── package.json
├── tsconfig.json
└── README.md
```