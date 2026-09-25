const BASE = "http://app.invalid";

// 입장 후 되돌아갈 주소가 앱 안의 경로일 때만 쓴다.
// 브라우저와 같은 URL 파서로 해석해 판단한다. 문자열 검사만 하면
// "/\t/evil.com"처럼 파서가 탭·줄바꿈을 지운 뒤 "//evil.com"이 되는 주소를 놓친다.
export function safeRedirectPath(path: string | null | undefined): string {
  if (!path?.startsWith("/")) return "/";

  const url = new URL(path, BASE);
  if (url.origin !== BASE) return "/";
  return url.pathname + url.search + url.hash;
}
