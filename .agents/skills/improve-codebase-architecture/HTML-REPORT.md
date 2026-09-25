# HTML 보고서 형식

아키텍처 리뷰는 OS 임시 디렉터리에 있는 자체 완결형 HTML 파일 하나로 렌더링됩니다. Tailwind와 Mermaid는 모두 CDN에서 가져옵니다. Mermaid는 그래프 형태의 다이어그램을 안정적으로 처리하고, 직접 만든 div와 인라인 SVG는 좀 더 편집적인 시각 자료(질량 다이어그램, 단면도)를 담당합니다. 둘을 섞어 쓰세요. 모든 것을 Mermaid에 의존하면 뻔해 보이기 시작합니다.

## 뼈대(Scaffold)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>{{repo name}} 아키텍처 리뷰</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      /* Tailwind로 깔끔하게 처리되지 않는 것들을 위한 작은 커스텀 레이어:
         점선 seam 선, 손으로 그린 느낌의 화살촉 등 */
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: #dc2626; }
      .deep { background: linear-gradient(135deg, #0f172a, #1e293b); }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

## 헤더

리포지토리 이름, 날짜, 그리고 간결한 범례: 실선 상자 = module, 점선 = seam, 빨간 화살표 = 누수(leakage), 두껍고 어두운 상자 = deep module. 소개 문단은 넣지 마세요. 곧바로 후보로 들어가세요.

## 후보 카드

다이어그램이 핵심을 전달합니다. 글은 적고 평이하게 쓰며, (`/codebase-design` 스킬의) 용어집 용어를 격식 없이 사용합니다.

각 후보는 하나의 `<article>`입니다.

- **제목**: 짧게, 심화 내용을 명명합니다(예: "Order intake 파이프라인 통합하기").
- **배지 행**: 추천 강도(`Strong` = emerald, `Worth exploring` = amber, `Speculative` = slate)와 의존성 범주 태그(`in-process`, `local-substitutable`, `ports & adapters`, `mock`).
- **파일**: 고정폭 글꼴 목록, `font-mono text-sm`.
- **이전 / 이후 다이어그램**: 핵심 요소입니다. 두 열로 나란히 배치합니다. 아래 패턴을 참고하세요.
- **문제**: 한 문장. 무엇이 아픈지.
- **해결책**: 한 문장. 무엇이 바뀌는지.
- **이득**: 글머리 기호, 각각 6단어 이하. 예: "테스트가 하나의 interface만 호출", "가격 로직 누수 중단", "shallow wrapper 4개 삭제".
- **ADR 콜아웃**(해당하는 경우): 호박색(amber) 배경 상자 안에 한 줄.

설명 문단은 넣지 마세요. 다이어그램을 이해하는 데 문단이 필요하다면 다이어그램을 다시 그리세요.

## 다이어그램 패턴

후보에 맞는 패턴을 고르세요. 섞어 쓰세요. 모든 다이어그램을 똑같이 보이게 만들지 마세요. 다양성도 목적의 일부입니다.

### Mermaid 그래프 (의존성 / 호출 흐름의 주력 도구)

"X가 Y를 호출하고 Y가 Z를 호출하는데, 이 난장판을 보라"가 요점일 때 Mermaid `flowchart`나 `graph`를 사용하세요. 뜬금없이 끼워 넣은 느낌이 들지 않도록 Tailwind 스타일 카드로 감싸세요. classDef로 누수 간선은 빨간색, deep module은 어두운 색으로 스타일을 지정하세요. 시퀀스 다이어그램은 "이전: 왕복 6회, 이후: 1회" 같은 경우에 잘 맞습니다.

```html
<div class="rounded-lg border border-slate-200 bg-white p-4">
  <pre class="mermaid">
    flowchart LR
      A[OrderHandler] --> B[OrderValidator]
      B --> C[OrderRepo]
      C -.leak.-> D[PricingClient]
      classDef leak stroke:#dc2626,stroke-width:2px;
      class C,D leak
  </pre>
</div>
```

### 직접 만든 상자와 화살표 (Mermaid의 레이아웃이 말을 듣지 않을 때)

module은 테두리와 레이블이 있는 `<div>`로 만듭니다. 화살표는 relative 컨테이너 위에 absolute로 배치한 인라인 SVG `<line>` 또는 `<path>` 요소로 만듭니다. "이후" 다이어그램을 내부가 회색으로 흐려진, 두꺼운 테두리의 deep module 하나처럼 보이게 하고 싶을 때 이 방법을 쓰세요. Mermaid로는 그 무게감을 제대로 표현할 수 없습니다.

### 단면도 (계층화된 shallow함에 적합)

가로 띠(`h-12 border-l-4`)를 쌓아 호출이 거쳐 가는 계층을 보여 주세요. 이전: 각각 아무 일도 하지 않는 얇은 계층 6개. 이후: 통합된 책임이 레이블로 붙은 두꺼운 띠 1개.

### 질량 다이어그램 ("implementation만큼 넓은 interface"에 적합)

module마다 직사각형 두 개: 하나는 interface 표면적, 하나는 implementation. 이전: interface 직사각형이 implementation 직사각형과 거의 같은 높이(shallow). 이후: interface 직사각형은 짧고 implementation 직사각형은 높음(deep).

### 호출 그래프 접기

이전: 중첩된 상자로 렌더링한 함수 호출 트리. 이후: 같은 트리를 상자 하나로 접고, 이제 내부가 된 호출들을 그 안에 흐리게 표시.

## 스타일 지침

- 기업용 대시보드가 아니라 편집물 느낌으로. 여백은 넉넉하게. 제목에는 세리프를 선택적으로 사용(`font-serif`는 stone/slate와 잘 어울림).
- 색은 절제해서: 강조색 하나(emerald 또는 indigo)에 누수는 빨간색, 경고는 호박색(amber).
- 이전/이후가 스크롤 없이 편하게 나란히 놓이도록 다이어그램 높이는 약 320px로 유지.
- 다이어그램 안의 module 레이블에는 `text-xs uppercase tracking-wider`를 사용해 UI가 아니라 도식처럼 읽히게 할 것.
- 스크립트는 Tailwind CDN과 Mermaid ESM import뿐입니다. 그 외에는 정적인 보고서입니다. 앱 코드도 없고, Mermaid 자체 렌더링 외의 상호작용도 없습니다.

## 최우선 추천 섹션

더 큰 카드 하나. 후보 이름, 이유 한 문장, 해당 카드로 가는 앵커 링크. 그게 전부입니다.

## 어조

평이하고 간결하게 쓰되, 아키텍처 관련 명사와 동사는 `/codebase-design` 스킬에서 그대로 가져옵니다. 간결함이 용어를 벗어나도 된다는 핑계는 아닙니다.

**정확히 사용할 것:** module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, locality.

**절대 대체하지 말 것:** component, service, unit (module 대신) · API, signature (interface 대신) · boundary (seam 대신) · layer, wrapper (module을 뜻할 때 module 대신).

**스타일에 맞는 표현:**

- "Order intake module은 shallow함: interface가 implementation과 거의 같음."
- "Pricing이 seam을 넘어 새어 나감."
- "심화: interface 하나, 테스트할 곳 하나."
- "adapter 두 개가 seam을 정당화함: 프로덕션에서는 HTTP, 테스트에서는 in-memory."

**이득 글머리 기호**는 얻는 것을 용어집 용어로 명명합니다: *"locality: 버그가 하나의 module에 모임"*, *"leverage: interface 하나, 호출 지점 N개"*, *"interface는 줄고, implementation이 wrapper들을 흡수함"*. *"유지보수가 쉬워짐"*이나 *"더 깔끔한 코드"*라고 쓰지 마세요. 이런 표현은 용어집에 없으며 자리를 차지할 가치가 없습니다.

얼버무리지 말고, 뜸 들이지 말고, "주목할 만한 점은…" 같은 말도 쓰지 마세요. 문장을 글머리 기호로 바꿀 수 있다면 바꾸세요. 글머리 기호를 뺄 수 있다면 빼세요. 어떤 용어가 `/codebase-design` 용어집에 없다면, 새 용어를 만들기 전에 용어집에 있는 용어를 찾아 쓰세요.
