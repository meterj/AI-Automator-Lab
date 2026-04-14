# frontend_implementation_harness.md

## 구현 원칙
- 디자인 규칙과 구현 규칙을 분리한다.
- UI 상태는 코드 숨김이 아니라 구조적으로 표현한다.
- 재사용 가능한 스타일/리소스를 우선한다.

## WPF/XAML 체크포인트
- ResourceDictionary 구조화
- Style/ControlTemplate 재사용
- 상태 표현(hover, focus, disabled) 일관화
- View와 로직 분리
- 큰 화면/복합 화면에서 레이아웃 안정성 점검
- 스크롤, 가상화, 성능 확인
