# CONTEXT.md 형식

## 구조

```md
# {Context Name}

{이 컨텍스트가 무엇이고 왜 존재하는지에 대한 한두 문장의 설명.}

## Language

**Order**:
{용어에 대한 한두 문장의 설명}
_Avoid_: Purchase, transaction

**Invoice**:
배송 후 고객에게 보내는 결제 요청.
_Avoid_: Bill, payment request

**Customer**:
주문을 하는 개인 또는 조직.
_Avoid_: Client, buyer, account
```

## 규칙

- **분명한 의견을 가져라.** 같은 개념에 여러 단어가 있다면 가장 좋은 것을 고르고 나머지는 `_Avoid_` 아래에 나열하라.
- **정의는 간결하게.** 최대 한두 문장. 무엇을 하는지가 아니라 무엇인지를 정의하라.
- **이 프로젝트의 컨텍스트에 특화된 용어만 포함하라.** 일반적인 프로그래밍 개념(타임아웃, 오류 타입, 유틸리티 패턴)은 프로젝트가 많이 사용하더라도 속하지 않는다. 용어를 추가하기 전에 물어보라: 이것이 이 컨텍스트에 고유한 개념인가, 일반적인 프로그래밍 개념인가? 전자만 속한다.
- 자연스러운 묶음이 생기면 **용어를 소제목 아래로 묶어라**. 모든 용어가 하나의 응집된 영역에 속한다면 평평한 목록도 괜찮다.

## 단일 vs 다중 컨텍스트 저장소

**단일 컨텍스트(대부분의 저장소):** 저장소 루트에 `CONTEXT.md` 하나.

**다중 컨텍스트:** 저장소 루트의 `CONTEXT-MAP.md`가 컨텍스트들, 그 위치, 그리고 서로의 관계를 나열한다:

```md
# Context Map

## Contexts

- [Ordering](./src/ordering/CONTEXT.md): 고객 주문을 받고 추적한다
- [Billing](./src/billing/CONTEXT.md): 청구서를 생성하고 결제를 처리한다
- [Fulfillment](./src/fulfillment/CONTEXT.md): 창고 피킹과 배송을 관리한다

## Relationships

- **Ordering → Fulfillment**: Ordering이 `OrderPlaced` 이벤트를 발행하고, Fulfillment가 이를 소비하여 피킹을 시작한다
- **Fulfillment → Billing**: Fulfillment가 `ShipmentDispatched` 이벤트를 발행하고, Billing이 이를 소비하여 청구서를 생성한다
- **Ordering ↔ Billing**: `CustomerId`와 `Money`에 대한 공유 타입
```

스킬은 어떤 구조가 적용되는지 추론한다:

- `CONTEXT-MAP.md`가 있다면, 그것을 읽어 컨텍스트들을 찾는다
- 루트 `CONTEXT.md`만 있다면, 단일 컨텍스트다
- 둘 다 없다면, 첫 용어가 확정될 때 루트 `CONTEXT.md`를 느긋하게 만든다

여러 컨텍스트가 있을 때는 현재 주제가 어느 것과 관련되는지 추론하라. 불분명하면 물어보라.
