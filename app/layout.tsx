import type { Metadata } from "next";
import "./globals.css";
import "./entry-release.css";
import "./public-shell.css";
import "./public-editorial.css";
import "./ui-refinement.css";
import "./production-optimization.css";
import {VisitTracker} from "./visit-tracker";
import {cookies} from "next/headers";
import {SiteLanguageProvider} from "./use-site-language";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.100game.art"),
  title: "HOW 100 PEOPLE CALL A GAME / 一百个人怎么做游戏",
  description: "HOW 100 PEOPLE CALL A GAME / 一百个人怎么做游戏，共同创作项目网站与参与者问卷。",
  alternates: { canonical: "/" },
  openGraph: { title: "HOW 100 PEOPLE CALL A GAME", description: "一百个人怎么做游戏 · 共同创作项目" },
  twitter: { card: "summary", title: "HOW 100 PEOPLE CALL A GAME", description: "一百个人怎么做游戏 · 共同创作项目" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const language=(await cookies()).get("hundred-language")?.value==="en"?"en":"zh";
  return <html lang={language==="zh"?"zh-CN":"en"}><body><SiteLanguageProvider initial={language}><VisitTracker/>{children}</SiteLanguageProvider></body></html>;
}
