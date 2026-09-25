import { describe, expect, it } from "vitest";
import { createSessionToken, passwordsMatch, verifySessionToken } from "./session";

const keys = { secret: "server-secret", password: "entry-pw" };
const NOW = Date.parse("2026-09-25T00:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

describe("세션 토큰", () => {
  it("만료 전에는 같은 키로 검증된다", async () => {
    const token = await createSessionToken("entry", keys, NOW + 30 * DAY);
    expect(await verifySessionToken(token, "entry", keys, NOW)).toBe(true);
    expect(await verifySessionToken(token, "entry", keys, NOW + 30 * DAY - 1)).toBe(true);
  });

  it("만료 시각이 지나면 거부된다", async () => {
    const token = await createSessionToken("entry", keys, NOW + 30 * DAY);
    expect(await verifySessionToken(token, "entry", keys, NOW + 30 * DAY)).toBe(false);
  });

  it("비밀번호가 바뀌면 기존 토큰이 거부된다", async () => {
    const token = await createSessionToken("entry", keys, NOW + DAY);
    expect(await verifySessionToken(token, "entry", { ...keys, password: "new-pw" }, NOW)).toBe(false);
  });

  it("서명 비밀 값이 다르면 거부된다", async () => {
    const token = await createSessionToken("entry", keys, NOW + DAY);
    expect(await verifySessionToken(token, "entry", { ...keys, secret: "other" }, NOW)).toBe(false);
  });

  it("만료 시각을 조작하면 거부된다", async () => {
    const token = await createSessionToken("entry", keys, NOW + DAY);
    const [, signature] = token.split(".");
    const forged = `${NOW + 365 * DAY}.${signature}`;
    expect(await verifySessionToken(forged, "entry", keys, NOW)).toBe(false);
  });

  it("다른 종류의 세션 토큰으로는 통과할 수 없다", async () => {
    const token = await createSessionToken("admin", keys, NOW + DAY);
    expect(await verifySessionToken(token, "entry", keys, NOW)).toBe(false);
  });

  it.each([undefined, "", "garbage", "123", "abc.def", ".", "123."])(
    "형식이 잘못된 토큰(%s)은 거부된다",
    async (token) => {
      expect(await verifySessionToken(token, "entry", keys, NOW)).toBe(false);
    },
  );
});

describe("passwordsMatch", () => {
  it("같은 비밀번호면 true", async () => {
    expect(await passwordsMatch("entry-pw", "entry-pw")).toBe(true);
  });

  it("다른 비밀번호면 false", async () => {
    expect(await passwordsMatch("entry-px", "entry-pw")).toBe(false);
  });

  it("길이가 달라도 false", async () => {
    expect(await passwordsMatch("entry", "entry-pw")).toBe(false);
    expect(await passwordsMatch("", "entry-pw")).toBe(false);
  });
});
