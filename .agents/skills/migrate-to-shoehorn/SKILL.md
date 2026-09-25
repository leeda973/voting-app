---
name: migrate-to-shoehorn
description: 테스트 파일의 `as` 타입 단언을 @total-typescript/shoehorn으로 마이그레이션합니다. 사용자가 shoehorn을 언급하거나, 테스트에서 `as`를 대체하고 싶어 하거나, 부분(partial) 테스트 데이터가 필요할 때 사용하세요.
---

# Shoehorn으로 마이그레이션

## 왜 shoehorn인가?

`shoehorn`을 사용하면 TypeScript의 타입 검사를 만족시키면서 테스트에 부분 데이터를 전달할 수 있습니다. `as` 단언을 타입 안전한 대안으로 대체합니다.

**테스트 코드 전용입니다.** 프로덕션 코드에서는 절대 shoehorn을 사용하지 마세요.

테스트에서 `as`를 사용할 때의 문제점:

- 사용하지 않도록 길들여져 있음
- 대상 타입을 수동으로 지정해야 함
- 의도적으로 잘못된 데이터에는 이중 as(`as unknown as Type`)가 필요함

## 설치

```bash
npm i @total-typescript/shoehorn
```

## 마이그레이션 패턴

### 필요한 속성이 적은 큰 객체

이전:

```ts
type Request = {
  body: { id: string };
  headers: Record<string, string>;
  cookies: Record<string, string>;
  // ...20개의 속성이 더 있음
};

it("gets user by id", () => {
  // body.id만 필요하지만 Request 전체를 가짜로 만들어야 함
  getUser({
    body: { id: "123" },
    headers: {},
    cookies: {},
    // ...20개 속성 모두를 가짜로 채움
  });
});
```

이후:

```ts
import { fromPartial } from "@total-typescript/shoehorn";

it("gets user by id", () => {
  getUser(
    fromPartial({
      body: { id: "123" },
    }),
  );
});
```

### `as Type` → `fromPartial()`

이전:

```ts
getUser({ body: { id: "123" } } as Request);
```

이후:

```ts
import { fromPartial } from "@total-typescript/shoehorn";

getUser(fromPartial({ body: { id: "123" } }));
```

### `as unknown as Type` → `fromAny()`

이전:

```ts
getUser({ body: { id: 123 } } as unknown as Request); // 의도적으로 잘못된 타입
```

이후:

```ts
import { fromAny } from "@total-typescript/shoehorn";

getUser(fromAny({ body: { id: 123 } }));
```

## 각 함수를 언제 사용하나

| 함수            | 사용 사례                                                   |
| --------------- | ----------------------------------------------------------- |
| `fromPartial()` | 타입 검사를 통과하는 부분 데이터 전달                       |
| `fromAny()`     | 의도적으로 잘못된 데이터 전달 (자동 완성은 유지됨)          |
| `fromExact()`   | 전체 객체를 강제 (나중에 fromPartial로 교체)                |

## 워크플로

1. **요구 사항 수집** - 사용자에게 질문:
   - 어떤 테스트 파일에서 `as` 단언이 문제를 일으키고 있나요?
   - 일부 속성만 중요한 큰 객체를 다루고 있나요?
   - 에러 테스트를 위해 의도적으로 잘못된 데이터를 전달해야 하나요?

2. **설치 및 마이그레이션**:
   - [ ] 설치: `npm i @total-typescript/shoehorn`
   - [ ] `as` 단언이 있는 테스트 파일 찾기: `grep -r " as [A-Z]" --include="*.test.ts" --include="*.spec.ts"`
   - [ ] `as Type`을 `fromPartial()`로 교체
   - [ ] `as unknown as Type`을 `fromAny()`로 교체
   - [ ] `@total-typescript/shoehorn`에서 import 추가
   - [ ] 타입 검사를 실행해 확인
