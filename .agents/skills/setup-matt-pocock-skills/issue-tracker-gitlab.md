# 이슈 트래커: GitLab

이 저장소의 이슈와 스펙은 GitLab 이슈로 관리된다. 모든 작업에 [`glab`](https://gitlab.com/gitlab-org/cli) CLI를 사용한다.

## 관례

- **이슈 생성**: `glab issue create --title "..." --description "..."`. 여러 줄 설명에는 heredoc을 사용한다. 에디터를 열려면 `--description -`를 전달한다.
- **이슈 읽기**: `glab issue view <number> --comments`. 기계가 읽을 수 있는 출력에는 `-F json`을 사용한다.
- **이슈 목록**: `glab issue list -F json`에 적절한 `--label` 필터를 붙인다.
- **이슈에 댓글 달기**: `glab issue note <number> --message "..."`. GitLab은 댓글을 "notes"라고 부른다.
- **라벨 적용 / 제거**: `glab issue update <number> --label "..."` / `--unlabel "..."`. 여러 라벨은 쉼표로 구분하거나 플래그를 반복해서 지정할 수 있다.
- **닫기**: `glab issue close <number>`. `glab issue close`는 닫기 댓글을 받지 않으므로, 먼저 `glab issue note <number> --message "..."`로 설명을 남긴 다음 닫는다.
- **Merge request**: GitLab은 PR을 "merge requests"라고 부른다. `glab mr create`, `glab mr view`, `glab mr note` 등을 사용한다. `gh pr ...`와 같은 형태이며, `pr` 대신 `mr`, `comment`/`--body` 대신 `note`/`--message`를 쓴다.

저장소는 `git remote -v`로 추론한다. 클론 안에서 실행하면 `glab`가 자동으로 처리한다.

## 트리아지 대상으로서의 Merge Request

**MRs as a request surface: no.** _(이 저장소가 외부 merge request를 기능 요청으로 취급한다면 `yes`로 설정한다. `/triage`가 이 플래그를 읽는다.)_

`yes`로 설정하면 MR도 이슈와 같은 라벨과 상태를 거치며, 대응하는 `glab mr` 명령을 사용한다.

- **MR 읽기**: `glab mr view <number> --comments`, diff는 `glab mr diff <number>`.
- **트리아지할 외부 MR 목록**: `glab mr list -F json` 후 작성자가 프로젝트 멤버/소유자가 아닌 MR만 남긴다 (메인테이너의 진행 중인 작업이 아니라 기여자의 MR).
- **댓글 / 라벨 / 닫기**: `glab mr note`, `glab mr update --label`/`--unlabel`, `glab mr close`.

GitHub와 달리 GitLab은 이슈와 MR에 번호를 따로 매기므로, 메인테이너가 어느 쪽을 말하는지 알면 `#42`는 모호하지 않다.

## 스킬이 "publish to the issue tracker"라고 할 때

GitLab 이슈를 생성한다.

## 스킬이 "fetch the relevant ticket"이라고 할 때

`glab issue view <number> --comments`를 실행한다.

## 길찾기(Wayfinding) 작업

`/wayfinder`가 사용한다. **map**은 **child** 이슈들을 티켓으로 가지는 단일 이슈다.

- **Map**: `wayfinder:map` 라벨이 붙은 단일 이슈로, 노트 / 지금까지의 결정 / 아직 명시되지 않음 본문을 담는다. `glab issue create --label wayfinder:map`. (네이티브 epic이 있는 GitLab 요금제에서는 epic이 map을 대신할 수도 있다. 라벨이 붙은 이슈는 어디서나 동작한다.)
- **Child 티켓**: 설명 맨 위에 `Part of #<map>`이 있고 `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`) 라벨이 붙은 이슈. claim되면 티켓은 작업을 주도하는 개발자에게 할당된다.
- **Blocking**: GitLab의 **네이티브 blocking 링크**로, UI에서 보이는 표준 표현이다. `/blocked_by #<n>` 빠른 작업(quick action)을 note로 게시해 추가한다 (`glab issue note <child> --message "/blocked_by #<blocker>"`). 네이티브 blocking 링크는 Premium/Ultimate 기능이다. 무료 요금제(또는 사용할 수 없는 곳)에서는 설명 맨 위의 `Blocked by: #<n>, #<n>` 줄로 대체한다. 모든 차단 이슈가 닫히면 티켓의 차단이 풀린다.
- **Frontier 조회**: map의 child로 범위를 한정한 `glab issue list -F json`에서, 열린 차단 이슈가 있는 것(열린 이슈로 향하는 네이티브 `blocked_by` 링크(`glab api projects/:id/issues/:iid/links`), 또는 `Blocked by` 줄에 열린 이슈가 있음)이나 담당자가 있는 것은 제외한다. map 순서상 첫 번째가 우선이다.
- **Claim**: `glab issue update <n> --assignee @me`, 세션의 첫 번째 쓰기 작업이다.
- **Resolve**: `glab issue note <n> --message "<answer>"`, 그다음 `glab issue close <n>`, 그다음 map의 지금까지의 결정에 컨텍스트 포인터(요지 + 링크)를 덧붙인다.
