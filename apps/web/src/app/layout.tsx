import type { Metadata } from "next";
import { formatProductBrandTitle, resolveProductBrandForEnvironment } from "./brand";
import "./styles.css";

const productBrand = resolveProductBrandForEnvironment(process.env);

export const metadata: Metadata = {
  title: formatProductBrandTitle(productBrand),
  description: productBrand.isExperimental
    ? "7bam betaは、招待された小さなグループで今日の写真を持ち寄り、あとで一冊のZINEにする共有ベータです。"
    : "少人数で写真を持ち寄り、数日分の投稿からZINEを作るブラウザ内デモ。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
