# 이슈 트래커: 로컬 마크다운

이 저장소의 이슈와 스펙은 `.scratch/` 아래 마크다운 파일로 관리한다.

## 규칙

- 기능 하나당 디렉터리 하나: `.scratch/<feature-slug>/`
- 스펙은 `.scratch/<feature-slug>/spec.md`
- 구현 이슈는 티켓 하나당 파일 하나로 `.scratch/<feature-slug>/issues/<NN>-<slug>.md`에 두고 `01`부터 번호를 매긴다. 티켓 여러 개를 한 파일에 합치지 않는다.
- 분류 상태는 각 이슈 파일 위쪽의 `Status:` 줄에 기록한다(역할 문자열은 `triage-labels.md` 참고).
- 댓글과 대화 기록은 파일 맨 아래 `## Comments` 제목 밑에 이어 붙인다.

## 스킬이 "이슈 트래커에 게시하라"고 할 때

`.scratch/<feature-slug>/` 아래에 새 파일을 만든다(디렉터리가 없으면 만든다).

## 스킬이 "관련 티켓을 가져오라"고 할 때

참조된 경로의 파일을 읽는다. 보통 사용자가 경로나 이슈 번호를 직접 알려준다.

## 길찾기(wayfinding) 작업

`/wayfinder`가 사용한다. **지도(map)**는 파일 하나이고, 티켓마다 **하위(child)** 파일이 하나씩 있다.

- **지도**: `.scratch/<effort>/map.md` (노트 / 지금까지의 결정 / 아직 명시되지 않음 본문).
- **하위 티켓**: `.scratch/<effort>/issues/NN-<slug>.md`. `01`부터 번호를 매기고 본문에 질문을 적는다. `Type:` 줄에 티켓 종류(`research`/`prototype`/`grilling`/`task`)를, `Status:` 줄에 `claimed`/`resolved`를 기록한다.
- **차단(blocking)**: 위쪽에 `Blocked by: NN, NN` 줄을 둔다. 나열된 파일이 모두 `resolved`가 되면 차단이 풀린다.
- **프런티어(frontier)**: `.scratch/<effort>/issues/`에서 열려 있고, 차단되지 않았고, 아무도 맡지 않은 파일을 찾는다. 번호가 가장 작은 것이 먼저다.
- **맡기(claim)**: 작업을 시작하기 전에 `Status: claimed`로 바꾸고 저장한다.
- **해결(resolve)**: `## Answer` 제목 밑에 답을 이어 붙이고 `Status: resolved`로 바꾼 뒤, `map.md`의 지금까지의 결정에 요지와 링크를 덧붙인다.
