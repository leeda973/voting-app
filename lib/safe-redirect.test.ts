import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it.each(["/", "/polls/abc", "/polls/abc?x=1#top"])("앱 안의 경로(%s)는 그대로 쓴다", (path) => {
    expect(safeRedirectPath(path)).toBe(path);
  });

  it.each([null, undefined, ""])("값이 없으면(%s) 목록으로 간다", (path) => {
    expect(safeRedirectPath(path)).toBe("/");
  });

  it.each([
    "//evil.com",
    "/\\evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "/\r/evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "polls/abc",
  ])(
    "앱 밖으로 나가는 주소(%s)는 목록으로 바꾼다",
    (path) => {
      expect(safeRedirectPath(path)).toBe("/");
    },
  );
});
