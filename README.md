# 동아리 투표

동아리 구성원이 관리자가 올린 질문에 선택지 하나를 골라 투표하고 결과를 확인하는 웹앱입니다. Next.js(App Router), TypeScript, Neon Postgres로 만들고 Vercel에 배포합니다.

- 용어: [CONTEXT.md](CONTEXT.md)
- 스펙: [.scratch/voting-app/spec.md](.scratch/voting-app/spec.md)
- 결정 기록: [docs/adr/](docs/adr/)

## 준비

1. 의존성을 설치합니다.

   ```bash
   npm install
   ```

2. 저장소 루트에 `.env.local`을 만들고 Neon 연결 문자열을 넣습니다.

   ```bash
   DATABASE_URL=postgres://...
   ```

## 데이터베이스 스키마 적용

스키마는 [db/schema.sql](db/schema.sql) 파일 하나로 관리합니다. 마이그레이션 도구는 쓰지 않습니다.

```bash
npm run db:schema
```

`.env.local`의 `DATABASE_URL`에 연결해 스키마를 적용하고, 만들어진 테이블 목록을 출력합니다. 모든 문장이 `IF NOT EXISTS`라서 여러 번 실행해도 안전합니다. 대신 이미 있는 테이블은 건너뛰므로, `schema.sql`에서 열이나 제약을 바꿨다면 그 변경은 직접 `ALTER TABLE`로 적용해야 합니다.

Neon 콘솔의 SQL Editor에 `db/schema.sql` 내용을 붙여 넣어 실행해도 됩니다.

### 스키마 변경 기록

- 2026-09-25: `polls`에 `closes_at`(마감 시각, NULL 허용) 열 추가. `schema.sql`의 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`가 이미 있는 테이블에도 적용하므로 `npm run db:schema`를 다시 실행하면 됩니다. 기존 투표는 마감 시각 없이(NULL) 그대로 유지됩니다.

## 개발

```bash
npm run dev    # 개발 서버 (http://localhost:3000)
npm test       # 테스트 (Vitest)
npm run lint   # 린트
npm run build  # 프로덕션 빌드
```
