import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "7bam | 今日のテーマ",
  description: "7bam（セブンバム）のブラウザ内ローカルデモ。今日のテーマに写真を追加し、この端末内だけで試せます。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

