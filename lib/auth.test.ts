import { beforeEach, describe, expect, it, vi } from "vitest";
import { forbiddenUnlessAdmin, hasAdminSession, hasAppAccess } from "./auth";
import { createSessionToken, type SessionKind } from "./session";

// 요청 쿠키를 흉내 낸다. 테스트마다 cookieJar를 채운다.
const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
  }),
}));

const SECRET = "test-secret";
const DAY = 24 * 60 * 60 * 1000;

function token(kind: SessionKind, password: string, expiresAt = Date.now() + DAY) {
  return createSessionToken(kind, { secret: SECRET, password }, expiresAt);
}

beforeEach(() => {
  cookieJar.clear();
  process.env.SESSION_SECRET = SECRET;
  process.env.ENTRY_PASSWORD = "entry-pw";
  process.env.ADMIN_PASSWORD = "admin-pw";
});

describe("hasAppAccess", () => {
  it("입장 세션만 있으면 들어갈 수 있다", async () => {
    expect(await hasAppAccess(await token("entry", "entry-pw"), undefined)).toBe(true);
  });

  it("관리자 세션만 있어도 들어갈 수 있다", async () => {
    expect(await hasAppAccess(undefined, await token("admin", "admin-pw"))).toBe(true);
  });

  it("둘 다 없으면 들어갈 수 없다", async () => {
    expect(await hasAppAccess(undefined, undefined)).toBe(false);
  });

  it("만료된 관리자 세션으로는 들어갈 수 없다", async () => {
    const expired = await token("admin", "admin-pw", Date.now() - 1);
    expect(await hasAppAccess(undefined, expired)).toBe(false);
  });
});

describe("hasAdminSession", () => {
  it("유효한 관리자 세션이면 관리자다", async () => {
    expect(await hasAdminSession(await token("admin", "admin-pw"))).toBe(true);
  });

  it("입장 세션은 관리자 세션이 아니다", async () => {
    expect(await hasAdminSession(await token("entry", "entry-pw"))).toBe(false);
  });

  it("관리자 비밀번호를 바꾸면 기존 관리자 세션이 무효가 된다", async () => {
    const old = await token("admin", "admin-pw");
    process.env.ADMIN_PASSWORD = "new-admin-pw";
    expect(await hasAdminSession(old)).toBe(false);
  });
});

describe("forbiddenUnlessAdmin", () => {
  it("관리자 세션이 없으면 403 forbidden 응답을 돌려준다", async () => {
    const response = await forbiddenUnlessAdmin();
    expect(response?.status).toBe(403);
    expect(await response?.json()).toMatchObject({ error: "forbidden" });
  });

  it("입장 세션만 있으면 403이다", async () => {
    cookieJar.set("entry_session", await token("entry", "entry-pw"));
    expect((await forbiddenUnlessAdmin())?.status).toBe(403);
  });

  it("유효한 관리자 세션이면 null을 돌려준다", async () => {
    cookieJar.set("admin_session", await token("admin", "admin-pw"));
    expect(await forbiddenUnlessAdmin()).toBeNull();
  });
});
