---
name: scaffold-exercises
description: 섹션, 문제(problem), 해답(solution), 설명(explainer)을 포함하고 린팅을 통과하는 연습 문제 디렉터리 구조를 만든다. 사용자가 연습 문제 뼈대 만들기("scaffold exercises"), 연습 문제 스텁 생성("create exercise stubs"), 새 강의 섹션 구성("set up a new course section")을 원할 때 사용한다.
---

# 연습 문제 뼈대 만들기

`pnpm ai-hero-cli internal lint`를 통과하는 연습 문제 디렉터리 구조를 만든 다음, `git commit`으로 커밋한다.

## 디렉터리 이름 규칙

- **섹션**: `exercises/` 안의 `XX-section-name/` (예: `01-retrieval-skill-building`)
- **연습 문제**: 섹션 안의 `XX.YY-exercise-name/` (예: `01.03-retrieval-with-bm25`)
- 섹션 번호 = `XX`, 연습 문제 번호 = `XX.YY`
- 이름은 dash-case(소문자, 하이픈)로 쓴다

## 연습 문제 변형

각 연습 문제에는 다음 하위 폴더 중 최소 하나가 필요하다.

- `problem/` - TODO가 있는 학생용 작업 공간
- `solution/` - 참고 구현
- `explainer/` - 개념 자료, TODO 없음

스텁을 만들 때는 계획에 따로 명시되지 않는 한 `explainer/`를 기본으로 한다.

## 필수 파일

각 하위 폴더(`problem/`, `solution/`, `explainer/`)에는 다음 조건을 만족하는 `readme.md`가 필요하다.

- **비어 있지 않을 것** (실제 내용이 있어야 하며, 제목 한 줄만 있어도 된다)
- 깨진 링크가 없을 것

스텁을 만들 때는 제목과 설명이 있는 최소한의 readme를 만든다.

```md
# Exercise Title

Description here
```

하위 폴더에 코드가 있다면 `main.ts`(1줄 초과)도 필요하다. 하지만 스텁이라면 readme만 있는 연습 문제도 괜찮다.

## 워크플로

1. **계획 파싱** - 섹션 이름, 연습 문제 이름, 변형 유형을 추출한다
2. **디렉터리 생성** - 각 경로마다 `mkdir -p`
3. **스텁 readme 생성** - 변형 폴더마다 제목이 있는 `readme.md` 하나씩
4. **lint 실행** - `pnpm ai-hero-cli internal lint`로 검증한다
5. **오류 수정** - lint가 통과할 때까지 반복한다

## lint 규칙 요약

린터(`pnpm ai-hero-cli internal lint`)는 다음을 검사한다.

- 각 연습 문제에 하위 폴더(`problem/`, `solution/`, `explainer/`)가 있는지
- `problem/`, `explainer/`, `explainer.1/` 중 최소 하나가 존재하는지
- 주 하위 폴더에 `readme.md`가 존재하고 비어 있지 않은지
- `.gitkeep` 파일이 없는지
- `speaker-notes.md` 파일이 없는지
- readme에 깨진 링크가 없는지
- readme에 `pnpm run exercise` 명령이 없는지
- readme만 있는 경우가 아니라면 하위 폴더마다 `main.ts`가 있는지

## 연습 문제 이동/이름 변경

연습 문제의 번호를 다시 매기거나 이동할 때:

1. 디렉터리 이름을 바꿀 때는 `mv`가 아니라 `git mv`를 사용한다 - git 히스토리가 보존된다
2. 순서를 유지하도록 숫자 접두사를 갱신한다
3. 이동 후 lint를 다시 실행한다

예시:

```bash
git mv exercises/01-retrieval/01.03-embeddings exercises/01-retrieval/01.04-embeddings
```

## 예시: 계획으로부터 스텁 만들기

다음과 같은 계획이 주어졌다면:

```
Section 05: Memory Skill Building
- 05.01 Introduction to Memory
- 05.02 Short-term Memory (explainer + problem + solution)
- 05.03 Long-term Memory
```

다음을 생성한다.

```bash
mkdir -p exercises/05-memory-skill-building/05.01-introduction-to-memory/explainer
mkdir -p exercises/05-memory-skill-building/05.02-short-term-memory/{explainer,problem,solution}
mkdir -p exercises/05-memory-skill-building/05.03-long-term-memory/explainer
```

그런 다음 readme 스텁을 만든다.

```
exercises/05-memory-skill-building/05.01-introduction-to-memory/explainer/readme.md -> "# Introduction to Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/explainer/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/problem/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/solution/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.03-long-term-memory/explainer/readme.md -> "# Long-term Memory"
```
