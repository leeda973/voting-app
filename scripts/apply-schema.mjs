// db/schema.sql을 DATABASE_URL의 DB에 적용한다.
// 사용법: npm run db:schema
import { readFile } from "node:fs/promises";
import { Pool } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL이 설정되어 있지 않습니다. .env.local을 확인하세요.");
  process.exit(1);
}

const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const pool = new Pool({ connectionString: url });

try {
  await pool.query(schema);
  const { rows } = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
  );
  console.log("스키마 적용 완료. 테이블:", rows.map((r) => r.table_name).join(", "));
} finally {
  await pool.end();
}
