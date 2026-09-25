# 이슈 트래커: 로컬 Markdown

이 저장소의 이슈와 스펙은 `.scratch/` 안의 markdown 파일로 관리된다.

## 관례

- 디렉터리 하나에 기능 하나: `.scratch/<feature-slug>/`
- 스펙은 `.scratch/<feature-slug>/spec.md`
- 구현 이슈는 티켓마다 파일 하나씩 `.scratch/<feature-slug>/issues/<NN>-<slug>.md`에 두며, `01`부터 번호를 매긴다. 여러 티켓을 합친 단일 파일은 절대 만들지 않는다
- 트리아지 상태는 각 이슈 파일 상단 근처의 `Status:` 줄로 기록한다 (역할 문자열은 `triage-labels.md` 참고)
- 댓글과 대화 기록은 파일 하단의 `## Comments` 제목 아래에 덧붙인다

## 스킬이 "publish to the issue tracker"라고 할 때

`.scratch/<feature-slug>/` 아래에 새 파일을 만든다 (필요하면 디렉터리도 만든다).

## 스킬이 "fetch the relevant ticket"이라고 할 때

참조된 경로의 파일을 읽는다. 보통 사용자가 경로나 이슈 번호를 직접 전달한다.

## 길찾기(Wayfinding) 작업

`/wayfinder`가 사용한다. **map**은 티켓마다 **child** 파일이 하나씩 딸린 파일이다.

- **Map**: `.scratch/<effort>/map.md` (노트 / 지금까지의 결정 / 아직 명시되지 않음 본문).
- **Child 티켓**: `.scratch/<effort>/issues/NN-<slug>.md`, `01`부터 번호를 매기고 본문에 질문을 적는다. `Type:` 줄은 티켓 유형(`research`/`prototype`/`grilling`/`task`)을, `Status:` 줄은 `claimed`/`resolved`를 기록한다.
- **Blocking**: 상단 근처의 `Blocked by: NN, NN` 줄. 나열된 모든 파일이 `resolved`이면 티켓의 차단이 풀린다.
- **Frontier**: `.scratch/<effort>/issues/`에서 열려 있고, 차단되지 않았고, 아무도 claim하지 않은 파일을 찾는다. 번호가 가장 앞선 것이 우선이다.
- **Claim**: 작업을 시작하기 전에 `Status: claimed`로 설정하고 저장한다.
- **Resolve**: `## Answer` 제목 아래에 답을 덧붙이고, `Status: resolved`로 설정한 다음, `map.md`의 지금까지의 결정에 컨텍스트 포인터(요지 + 링크)를 덧붙인다.
