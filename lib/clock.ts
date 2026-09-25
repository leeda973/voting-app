import { connection } from "next/server";

// 요청 시점의 현재 시각. 화면 렌더 중에 Date.now()를 직접 부르지 않도록(렌더 순수성 규칙) 여기서 읽는다.
// connection()으로 빌드 시점이 아니라 요청 시점에 읽는다는 것을 보장한다.
export async function requestTime(): Promise<number> {
  await connection();
  return Date.now();
}
