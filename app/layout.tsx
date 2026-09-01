import type { Metadata } from "next";
import "./globals.css";
import "./entry-release.css";
import "./public-shell.css";
import "./public-editorial.css";
import {VisitTracker} from "./visit-tracker";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.100game.art"),
  title: "WHAT 100 PEOPLE DO TO A GAME / 一百个人怎么做游戏",
  description: "WHAT 100 PEOPLE DO TO A GAME / 一百个人怎么做游戏，共同创作项目网站与参与者问卷。",
  alternates: { canonical: "/" },
  openGraph: { title: "WHAT 100 PEOPLE DO TO A GAME", description: "一百个人怎么做游戏 · 共同创作项目" },
  twitter: { card: "summary", title: "WHAT 100 PEOPLE DO TO A GAME", description: "一百个人怎么做游戏 · 共同创作项目" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body><VisitTracker/>{children}</body></html>;
}
