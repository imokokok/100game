import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hundred-people-game.jzwjf5xs57.chatgpt.site"),
  title: "开放参与式艺术计划 · Open Participatory Art Project",
  description: "一个关于共同创作、记录与反馈的参与式艺术协作平台。",
  alternates: { canonical: "/" },
  openGraph: { title: "开放参与式艺术计划", description: "共同创作、记录与反馈的参与式艺术项目。", images: ["/og.png"] },
  twitter: { card: "summary_large_image", title: "开放参与式艺术计划", description: "共同创作、记录与反馈的参与式艺术项目。", images: ["/og.png"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
