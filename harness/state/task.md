# task.md

## 작업 식별
- 작업명: WordPress 자동 포스팅 블로그 시스템 구축
- 요청자: 사용자
- 생성일: 2026-04-14
- 현재 상태: scoped
- 위험도: Low

## 최종 목표
- WordPress.com 블로그에 AI 생성 글 또는 RSS 수집 글을 자동으로 포스팅하는 시스템 구축

## 성공 기준
- [ ] Express + TypeScript API 서버 구동
- [ ] WordPress REST API 연동 완료
- [ ] OpenAI API로 글 자동 생성 기능
- [ ] RSS 피드 수집 및 포스팅 기능
- [ ] 스케줄러로 예약 발행 가능
- [ ] 보안 체크리스트 통과

## 현재 TODO
- [x] 요구사항 정리
- [x] 문맥 수집 (harness 규칙 확인)
- [ ] 계획 수립
- [ ] 승인 확인
- [ ] 실행
- [ ] 검증
- [ ] 평가
- [ ] 인수인계

## 현재 진행 중
- implementation_plan.md 작성 중

## 블로커 / 리스크
- WordPress.com API 토큰 발급 필요 (사용자 준비 필요)
- OpenAI API 키 필요 (사용자 준비 필요)

## 다음 액션
- implementation_plan.md 상세 작성
- 프로젝트 구조 생성

## 메모
- 포스팅 주제는 나중에 결정
- 기술 스택: Node.js + TypeScript + Express