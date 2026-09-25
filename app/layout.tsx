import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "동아리 투표",
  description: "질문에 선택지 하나를 골라 투표하고 결과를 확인하세요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
