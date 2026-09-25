---
name: setup-ts-deep-modules
description: TypeScript 저장소에 dependency-cruiser를 연결해 각 패키지를 깊은 모듈(deep module)로 만든다. 구현은 하위 폴더에 숨기고, 진입점(entry point) 파일을 통해서만 접근할 수 있게 한다. 사용자가 직접 호출한다.
disable-model-invocation: true
---

# TS 깊은 모듈 설정

이 저장소의 모든 패키지를 **깊은 모듈**(deep module)로 만든다: 작은 인터페이스 뒤에 많은 동작이 있는 모듈이다. 패키지의 공개 표면은 **진입점**(entry point, 패키지 루트에 있는 파일들)이며, 하위 폴더에 있는 모든 것은 숨겨진다. 이 스킬은 [dependency-cruiser](https://github.com/sverweij/dependency-cruiser)와 진입점을 유일한 출입구로 만드는 규칙을 설치한 다음, 규칙이 실제로 작동하는지 증명한다.

용어(deep module, interface, seam, depth)는 "codebase-design"으로 Skill 도구를 호출하고, 전체 과정에서 그 스킬의 용어를 사용한다.

## 이 스킬이 강제하는 형태

```
src/packages/
  <name>/
    index.ts        ← 진입점(공개). 외부에서는 이것을 import한다.
    client.ts       ← 또 다른 진입점. 패키지는 여러 개를 노출할 수 있다.
    lib/            ← 구현: 외부에서는 숨겨지며, 서로 자유롭게 import할 수 있다.
    tests/          ← 같은 위치에 둔 테스트 + 픽스처 (하위 폴더이므로 비공개).
```

공개 표면은 지정된 `index.ts` 하나가 아니라 패키지의 **루트 파일들**이다. 관례상 구현은 `lib/`에, 테스트는 `tests/`에 두어 모든 패키지가 같은 두 폴더 형태를 갖게 한다. 하지만 규칙 자체는 일반적이다: *어떤* 하위 폴더에 있는 *무엇이든* 비공개이므로, 폴더를 추가하려고 설정을 확장할 일이 없다.

규칙은 네 가지이며, 모두 `error`다.

1. **진입점 경계**: 패키지 외부의 코드(앱 코드 또는 다른 패키지)는 그 패키지의 진입점(루트 파일)만 import할 수 있으며, 하위 폴더의 어떤 것도 import할 수 없다.
2. **패키지 내부의 자유**: 패키지 자신의 파일들은 서로 자유롭게 import한다.
3. **진입점을 통한 테스트**: `<pkg>/tests/` 아래의 파일은 모든 패키지의 진입점과 자신의 `tests/` 픽스처를 import할 수 있지만, 어떤 패키지의 하위 폴더 내부도 import할 수 없다 (자기 패키지조차도). 패키지 간 통합 테스트는 괜찮지만, 깊은 import는 안 된다.
4. **순환 금지**: 의존성 순환이 없어야 한다.

**barrel이 아니라 진입점.** 공개 표면이 *모든* 루트 파일이므로, 패키지는 거대한 `index.ts` 하나로 모든 것을 몰아넣는 대신 작은 진입점 여러 개(`index.ts`, `client.ts`, `server.ts`)를 노출할 수 있다. 하위 트리 전체를 re-export하는 barrel 파일은 권장하지 않는다. 진입점은 작게 유지하고 구현은 하위 폴더에 숨긴다.

레이어링(어떤 패키지가 어떤 패키지에 의존할 수 있는지)은 *별개의* 관심사이며, 이 저장소가 채우도록 설정 파일에 주석 처리된 스텁으로 남겨둔다.

## 단계

### 1. 환경 감지

- **패키지 매니저**: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lockb` → bun, 그 외에는 npm. 아래의 모든 명령에 이것을 사용한다 (`pnpm`/`yarn`/`npm run`/`bunx`).
- **패키지 루트**: `src/`가 있으면 `src/packages`, 없으면 `packages`를 사용한다. 저장소에 이미 다른 명확한 관례가 있다면 사용자와 선택을 확인한다.
- **기존 설정**: `.dependency-cruiser.*` 파일이 있는지 확인한다. 있다면 덮어쓰지 **않는다**: 네 가지 규칙과 옵션을 병합해 넣고, 무엇을 추가했는지 사용자에게 알린다.

**완료 조건:** 패키지 매니저, 패키지 루트, 기존 설정 상태를 모두 파악했다.

### 2. dependency-cruiser 설치

감지한 패키지 매니저로 `dependency-cruiser`를 devDependency로 설치한다.

**완료 조건:** `dependency-cruiser`가 `devDependencies`에 있다.

### 3. 설정 작성

[`dependency-cruiser.config.cjs`](./dependency-cruiser.config.cjs)를 저장소 루트에 `.dependency-cruiser.cjs`로 복사한다. `PACKAGES_ROOT`를 1단계에서 감지한 루트로 설정한다. 규칙은 경로 깊이 기반이고 확장자와 무관하므로, 그 밖에 조정할 것은 없다.

**완료 조건:** `.dependency-cruiser.cjs`가 올바른 `PACKAGES_ROOT`와 함께 존재하고, 네 가지 forbidden 규칙이 들어 있다.

### 4. 검사에 연결

- `lint:boundaries` 스크립트를 추가한다: `depcruise <packages-root>` (또는 `depcruise src`).
- 이미 typecheck를 실행하는 저장소의 통합 검사 명령(예: `check` / `ci` / `validate` 스크립트)에 이것을 포함시킨다. `tsconfig`는 건드리지 **않으며** 경로 별칭도 추가하지 않는다.
- 통합 스크립트가 없다면 `lint:boundaries`를 추가하고 사용자에게 CI에 포함하라고 알린다.

**완료 조건:** `lint:boundaries`가 존재하고 typecheck와 같은 명령의 일부로 실행된다.

### 5. 예시 패키지 뼈대 만들기

복사해서 쓰는 템플릿으로 `<packages-root>/example/`을 만들어 커밋한다.

- `index.ts`는 진입점이다. 내부 파일에 위임하는 함수 하나를 export한다 (패키지가 단순 전달이 아니라 눈에 띄게 *깊도록*).
- `lib/impl.ts`: **하위 폴더**에 있는 내부 파일로, `index.ts`가 import하며 외부에서는 접근할 수 없다.
- `tests/example.test.ts`는 `../index`(진입점)**만** import하고 공개 함수에 대해 검증한다.

사용자에게 이것이 복사하거나 삭제할 수 있는 시작 템플릿이라고 알린다.

**완료 조건:** 예시 패키지가 존재하고, 루트 진입점을 통해 동작을 노출하며, `impl`을 하위 폴더에 숨긴다.

### 6. 규칙이 작동하는지 증명

이것이 스킬 전체의 완료 기준이다. 위반 시 실패하지 않는 설정은 쓸모가 없다.

1. `lint:boundaries`를 실행한다. 깨끗한 예시에서는 **통과**해야 한다.
2. `tests/example.test.ts`에 임시로 깊은 import를 추가한다 (예: `import { thing } from "../lib/impl"`). `lint:boundaries`를 다시 실행하면 `tests-through-entrypoints`로 **실패**해야 한다.
3. 깊은 import를 되돌린다. 한 번 더 실행하면 **통과**해야 한다.

**완료 조건:** 통과, 깊은 import에 대한 실패, 다시 통과를 순서대로 확인했다. 2단계가 실패하지 않는다면 규칙이 올바르게 연결되지 않은 것이므로, 마치기 전에 고친다.

### 7. 관례 문서화

**패키지 폴더 안에** `README.md`(`<packages-root>/README.md`, 관리 대상 패키지 옆)를 작성한다. 내용은 `src/packages/<name>/` 레이아웃(루트에 진입점, 구현은 `lib/`, 테스트는 `tests/`), "패키지의 진입점(루트 파일)을 통해서만 import한다", 그리고 `lint:boundaries` 실행 방법이다. **barrel 파일을 명시적으로 권장하지 않는다**: 하위 트리 전체를 index 하나로 re-export하는 대신 작은 진입점 여러 개를 노출하라고 적는다. 복사용 스니펫과 네 가지 규칙을 각각 한 문단씩만 담는다.

그런 다음 저장소의 에이전트 지침 파일(`CLAUDE.md`가 있으면 그것, 없으면 `AGENTS.md`, 둘 다 없으면 `AGENTS.md`를 만든다)에서 이 README로 향하는 **컨텍스트 포인터**를 추가한다. 한 줄이면 충분하다. 예: `패키지는 깊은 모듈이다: 패키지를 추가하거나 import하기 전에 [src/packages/README.md](./src/packages/README.md)를 확인한다.` 이것이 에이전트가 경계 규칙에 걸려 넘어지는 대신 그 규칙을 발견하게 만든다.

**완료 조건:** `<packages-root>/README.md`가 존재하고 barrel을 권장하지 않으며, 저장소의 `CLAUDE.md`/`AGENTS.md`가 이를 링크한다.

## 참고 사항

- 설정의 `$1` 역참조(dependency-cruiser의 그룹 매칭)가 패키지는 자신의 내부에 접근할 수 있고 외부는 그러지 못하게 만드는 핵심이다. 이것을 패키지별 개별 규칙으로 풀어 쓰지 않는다.
- 공개/비공개는 **깊이**로 결정된다: 패키지의 루트 파일은 진입점이고, 하위 폴더의 모든 것은 비공개다. 관례적인 하위 폴더는 `lib/`(구현)와 `tests/`이지만, 규칙은 이를 하드코딩하지 않는다. 어떤 하위 폴더든 비공개이므로, 새 폴더에 설정 변경이 필요 없다. 진입점을 추가하는 것은 루트 파일을 추가하는 것일 뿐이다 (barrel 없음).
- 패키지는 **평평하다**: 루트 아래 직계 자식 한 단계뿐이다. 패키지 내부는 원하는 만큼 깊이 중첩할 수 있지만, 패키지가 다른 패키지를 포함할 수는 없다.
- `"type": "module"` 저장소에서도 설정의 `module.exports`가 동작하도록 `.js`가 아니라 `.cjs`를 사용한다.
