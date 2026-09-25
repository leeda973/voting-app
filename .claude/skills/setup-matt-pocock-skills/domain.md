# 도메인 문서

엔지니어링 스킬이 코드베이스를 탐색할 때 이 저장소의 도메인 문서를 어떻게 활용해야 하는지 설명한다.

## 탐색 전에 다음을 읽는다

- 저장소 루트의 **`CONTEXT.md`**, 또는
- 저장소 루트에 있다면 **`CONTEXT-MAP.md`**: 컨텍스트마다 하나씩 있는 `CONTEXT.md`를 가리킨다. 주제와 관련된 것을 각각 읽는다.
- **`docs/adr/`**: 작업하려는 영역에 관련된 ADR을 읽는다. 멀티 컨텍스트 저장소에서는 컨텍스트 범위의 결정을 위해 `src/<context>/docs/adr/`도 확인한다.

이 파일들 중 존재하지 않는 것이 있으면 **조용히 진행한다**. 없다는 사실을 지적하지 말고, 미리 만들자고 제안하지도 않는다. `/domain-modeling` 스킬(`/grill-with-docs`와 `/improve-codebase-architecture`를 통해 호출됨)이 용어나 결정이 실제로 확정될 때 필요에 따라 만든다.

## 파일 구조

단일 컨텍스트 저장소 (대부분의 저장소):

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

멀티 컨텍스트 저장소 (루트에 `CONTEXT-MAP.md`가 있음):

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← 시스템 전체 결정
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← 컨텍스트별 결정
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## 용어집의 어휘를 사용한다

출력물에서 도메인 개념을 지칭할 때(이슈 제목, 리팩터링 제안, 가설, 테스트 이름 등) `CONTEXT.md`에 정의된 용어를 사용한다. 용어집이 명시적으로 피하는 동의어로 흘러가지 않는다.

필요한 개념이 아직 용어집에 없다면 그것은 신호다. 프로젝트가 쓰지 않는 언어를 지어내고 있거나(다시 생각해 본다), 실제로 빈틈이 있는 것이다(`/domain-modeling`을 위해 기록해 둔다).

## ADR 충돌을 알린다

출력물이 기존 ADR과 모순된다면, 조용히 덮어쓰지 말고 명시적으로 드러낸다.

> _ADR-0007(event-sourced orders)과 모순되지만, 다음 이유로 다시 논의할 가치가 있음…_
