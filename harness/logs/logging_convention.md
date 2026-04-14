# logging_convention.md

## 로그 작성 원칙
- 이벤트 1건당 1줄 JSON
- 사람이 읽을 수 있는 summary 포함
- 세부 내용은 details에 구조화
- 실패는 숨기지 않고 status=failed로 기록
- 재시도는 별도 이벤트로 남긴다

## 권장 event_type
- intake
- classify
- retrieve
- plan
- approve
- execute
- verify
- correct
- retry
- evaluate
- release
- rollback
