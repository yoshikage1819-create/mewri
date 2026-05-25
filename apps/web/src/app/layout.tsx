import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Mewri MVP v0",
  description: "Daily themes become a collaborative ZINE every 3 days."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

