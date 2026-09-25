# 이슈 트래커: GitHub

이 저장소의 이슈와 스펙은 GitHub 이슈로 관리된다. 모든 작업에 `gh` CLI를 사용한다.

## 관례

- **이슈 생성**: `gh issue create --title "..." --body "..."`. 여러 줄 본문에는 heredoc을 사용한다.
- **이슈 읽기**: `gh issue view <number> --comments`, `jq`로 댓글을 필터링하고 라벨도 함께 가져온다.
- **이슈 목록**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`에 적절한 `--label` 및 `--state` 필터를 붙인다.
- **이슈에 댓글 달기**: `gh issue comment <number> --body "..."`
- **라벨 적용 / 제거**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **닫기**: `gh issue close <number> --comment "..."`

저장소는 `git remote -v`로 추론한다. 클론 안에서 실행하면 `gh`가 자동으로 처리한다.

## 트리아지 대상으로서의 Pull Request

**PRs as a request surface: no.** _(이 저장소가 외부 PR을 기능 요청으로 취급한다면 `yes`로 설정한다. `/triage`가 이 플래그를 읽는다.)_

`yes`로 설정하면 PR도 이슈와 같은 라벨과 상태를 거치며, 대응하는 `gh pr` 명령을 사용한다.

- **PR 읽기**: `gh pr view <number> --comments`, diff는 `gh pr diff <number>`.
- **트리아지할 외부 PR 목록**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` 후 `authorAssociation`이 `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, `NONE`인 것만 남긴다 (`OWNER`/`MEMBER`/`COLLABORATOR`는 제외).
- **댓글 / 라벨 / 닫기**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub는 이슈와 PR이 하나의 번호 공간을 공유하므로 `#42`만으로는 둘 중 어느 것인지 알 수 없다. `gh pr view 42`로 확인하고, 안 되면 `gh issue view 42`로 넘어간다.

## 스킬이 "publish to the issue tracker"라고 할 때

GitHub 이슈를 생성한다.

## 스킬이 "fetch the relevant ticket"이라고 할 때

`gh issue view <number> --comments`를 실행한다.

## 길찾기(Wayfinding) 작업

`/wayfinder`가 사용한다. **map**은 **child** 이슈들을 티켓으로 가지는 단일 이슈다.

- **Map**: `wayfinder:map` 라벨이 붙은 단일 이슈로, 노트 / 지금까지의 결정 / 아직 명시되지 않음 본문을 담는다. `gh issue create --label wayfinder:map`.
- **Child 티켓**: GitHub sub-issue로 map에 연결된 이슈 (sub-issues 엔드포인트에 `gh api` 사용). sub-issue가 활성화되어 있지 않다면 map 본문의 작업 목록에 child를 추가하고 child 본문 맨 위에 `Part of #<map>`을 적는다. 라벨: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). claim되면 티켓은 작업을 주도하는 개발자에게 할당된다.
- **Blocking**: GitHub의 **네이티브 이슈 의존성**으로, UI에서 보이는 표준 표현이다. `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`로 간선을 추가한다. 여기서 `<blocker-db-id>`는 차단하는 이슈의 숫자 **database id**다 (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, `#number`나 `node_id`가 _아니다_). GitHub는 `issue_dependencies_summary.blocked_by`(열려 있는 차단 이슈만, 실시간 게이트)를 보고한다. 의존성 기능을 쓸 수 없다면 child 본문 맨 위의 `Blocked by: #<n>, #<n>` 줄로 대체한다. 모든 차단 이슈가 닫히면 티켓의 차단이 풀린다.
- **Frontier 조회**: map의 열린 child 목록을 가져오고(`gh issue list --state open`, map의 sub-issue / 작업 목록으로 범위 한정), 열린 차단 이슈가 있거나(`issue_dependencies_summary.blocked_by > 0`, 또는 `Blocked by` 줄에 열린 이슈가 있음) 담당자가 있는 것은 제외한다. map 순서상 첫 번째가 우선이다.
- **Claim**: `gh issue edit <n> --add-assignee @me`, 세션의 첫 번째 쓰기 작업이다.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, 그다음 `gh issue close <n>`, 그다음 map의 지금까지의 결정에 컨텍스트 포인터(요지 + 링크)를 덧붙인다.
