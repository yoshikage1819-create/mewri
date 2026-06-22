import type { Metadata, Viewport } from "next";
import "./styles.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffe500"
};

export const metadata: Metadata = {
  title: "7bam | 今日のテーマ",
  description: "7bam（セブンバム）のブラウザ内ローカルデモ。今日のテーマに写真を追加し、この端末内だけで試せます。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "7bam"
  },
  icons: {
    apple: [{ url: "/apple-touch-icon.svg", type: "image/svg+xml" }]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
