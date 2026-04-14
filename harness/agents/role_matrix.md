# Agent Role Matrix

| 역할 | 주요 책임 | 입력 | 출력 | 금지 |
|---|---|---|---|---|
| Router | 요청 분류, 위험도 판정 | 사용자 요청 | 작업 타입, risk level | 직접 대규모 수정 |
| Planner | 작업 분해, 계획 수립 | 목표, 제약 | implementation_plan.md | 승인 없이 실행 |
| Researcher | 자료/문맥 수집 | 검색 질의, 문맥 | 근거 패키지 | 근거 없는 추정 |
| Builder | 실제 생성/수정 | 승인된 계획 | 변경 결과 | 검증 생략 |
| Verifier | 형식/정합성 검증 | 결과물 | pass/fail | 결과 수정 주도 |
| Critic | 반례/허점 탐색 | 결과물 | 리스크 포인트 | 낙관적 통과 |
| Security | 정책/권한 점검 | 계획/출력 | 승인/차단 판단 | 업무 목적 외 접근 |
| Evaluator | 점수화/회귀 평가 | 로그, 결과 | eval_report.json | 근거 없는 호평 |
