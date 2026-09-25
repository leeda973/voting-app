# 언제 모킹할 것인가

**시스템 경계**에서만 모킹하라:

- 외부 API(결제, 이메일 등)
- 데이터베이스(경우에 따라 - 테스트 DB를 선호)
- 시간/난수
- 파일 시스템(경우에 따라)

모킹하지 말 것:

- 직접 작성한 클래스/모듈
- 내부 협력 객체
- 직접 제어할 수 있는 모든 것

## 모킹하기 쉬운 설계

시스템 경계에서는 모킹하기 쉬운 인터페이스를 설계하라:

**1. 의존성 주입을 사용하라**

외부 의존성을 내부에서 생성하지 말고 전달받아라:

```typescript
// 모킹하기 쉬움
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// 모킹하기 어려움
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**2. 범용 fetcher보다 SDK 스타일 인터페이스를 선호하라**

조건 로직이 들어간 범용 함수 하나 대신, 외부 작업마다 전용 함수를 만들어라:

```typescript
// 좋음: 각 함수를 독립적으로 모킹할 수 있다
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// 나쁨: 모킹하려면 mock 내부에 조건 로직이 필요하다
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

SDK 방식의 장점:
- 각 mock이 하나의 특정한 형태만 반환한다
- 테스트 준비 코드에 조건 로직이 없다
- 테스트가 어떤 엔드포인트를 사용하는지 보기 쉽다
- 엔드포인트별로 타입 안전성이 보장된다
