import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Mewri | 今日のテーマからZINEへ",
  description: "少人数で写真を持ち寄り、数日分の投稿からZINEを作るブラウザ内デモ。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

