import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hundred-people-game.jzwjf5xs57.chatgpt.site"),
  title: "100人游戏计划 · The 100 People Game",
  description: "一百个人共同参与的艺术游戏协作平台。",
  alternates: { canonical: "/" },
  openGraph: { title: "100人游戏计划", description: "一百个人，共同完成一场游戏。", images: ["/og.png"] },
  twitter: { card: "summary_large_image", title: "100人游戏计划", description: "一百个人，共同完成一场游戏。", images: ["/og.png"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
