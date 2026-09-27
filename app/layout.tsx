import type { Metadata } from "next";
import "./globals.css";
import "./public-editorial.css";
import {VisitTracker} from "./visit-tracker";

export const metadata: Metadata = {
  metadataBase: new URL("https://100game.art"),
  title: "HOW 100 PEOPLE CALL A GAME / 一百个人怎么做游戏",
  description: "HOW 100 PEOPLE CALL A GAME / 一百个人怎么做游戏，共同创作项目网站与参与者问卷。",
  alternates: { canonical: "/" },
  openGraph: { title: "HOW 100 PEOPLE CALL A GAME", description: "一百个人怎么做游戏 · 共同创作项目" },
  twitter: { card: "summary", title: "HOW 100 PEOPLE CALL A GAME", description: "一百个人怎么做游戏 · 共同创作项目" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body><VisitTracker/>{children}</body></html>;
}
