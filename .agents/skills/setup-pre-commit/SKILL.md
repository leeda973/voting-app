---
name: setup-pre-commit
description: 현재 저장소에 lint-staged(Prettier), 타입 검사, 테스트를 실행하는 Husky pre-commit 훅을 설정한다. 사용자가 pre-commit 훅 추가("add pre-commit hooks"), Husky 설정("set up Husky"), lint-staged 구성("configure lint-staged"), 또는 커밋 시점의 포맷팅/타입 검사/테스트 추가를 원할 때 사용한다.
---

# Pre-Commit 훅 설정

## 설정되는 항목

- **Husky** pre-commit 훅
- 스테이징된 모든 파일에 Prettier를 실행하는 **lint-staged**
- **Prettier** 설정 (없는 경우)
- pre-commit 훅 안의 **typecheck** 및 **test** 스크립트

## 단계

### 1. 패키지 매니저 감지

`package-lock.json`(npm), `pnpm-lock.yaml`(pnpm), `yarn.lock`(yarn), `bun.lockb`(bun)가 있는지 확인한다. 존재하는 것을 사용한다. 불분명하면 npm을 기본으로 한다.

### 2. 의존성 설치

devDependencies로 설치한다.

```
husky lint-staged prettier
```

### 3. Husky 초기화

```bash
npx husky init
```

이 명령은 `.husky/` 디렉터리를 만들고 package.json에 `prepare: "husky"`를 추가한다.

### 4. `.husky/pre-commit` 생성

다음 파일을 작성한다 (Husky v9+에서는 shebang이 필요 없다).

```
npx lint-staged
npm run typecheck
npm run test
```

**조정**: `npm`을 감지된 패키지 매니저로 바꾼다. 저장소의 package.json에 `typecheck`나 `test` 스크립트가 없다면 해당 줄을 빼고 사용자에게 알린다.

### 5. `.lintstagedrc` 생성

```json
{
  "*": "prettier --ignore-unknown --write"
}
```

### 6. `.prettierrc` 생성 (없는 경우)

Prettier 설정이 없을 때만 만든다. 다음 기본값을 사용한다.

```json
{
  "useTabs": false,
  "tabWidth": 2,
  "printWidth": 80,
  "singleQuote": false,
  "trailingComma": "es5",
  "semi": true,
  "arrowParens": "always"
}
```

### 7. 검증

- [ ] `.husky/pre-commit`이 존재하고 실행 가능하다
- [ ] `.lintstagedrc`가 존재한다
- [ ] package.json의 `prepare` 스크립트가 `"husky"`이다
- [ ] `prettier` 설정이 존재한다
- [ ] `npx lint-staged`를 실행해 동작하는지 확인한다

### 8. 커밋

변경/생성된 모든 파일을 stage하고 다음 메시지로 커밋한다: `Add pre-commit hooks (husky + lint-staged + prettier)`

이 커밋은 새 pre-commit 훅을 거치게 되므로, 모든 것이 동작하는지 확인하는 좋은 스모크 테스트가 된다.

## 참고 사항

- Husky v9+에서는 훅 파일에 shebang이 필요 없다
- `prettier --ignore-unknown`은 Prettier가 파싱할 수 없는 파일(이미지 등)을 건너뛴다
- pre-commit은 먼저 lint-staged(빠름, 스테이징된 파일만)를 실행한 다음, 전체 typecheck와 테스트를 실행한다
