"use client";

import { useEffect } from "react";
import {useSiteLanguage} from "./use-site-language";

// Global client error boundary. Without this, any uncaught error in a Client
// Component (e.g. an API missing on some phone WebViews) renders a blank page,
// which is exactly the "tap the invite link and get kicked out" symptom.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [lang]=useSiteLanguage();
  useEffect(() => {
    // Surface the real error so device-specific failures can be diagnosed.
    console.error("Client render error:", error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
        fontFamily: "system-ui, sans-serif",
        color: "#1a1a1a",
        background: "#fff",
      }}
    >
      <h1 style={{ fontSize: "1.25rem", margin: 0 }}>{lang==="zh"?"页面暂时无法显示":"This page could not load"}</h1>
      <p style={{ margin: 0, color: "#666", maxWidth: "28rem" }}>
        {lang==="zh"?"加载遇到了问题。请重试，或返回首页重新进入。已保存的草稿会保留。":"Something went wrong while loading. Try again or return home. Saved drafts will still be there."}
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: "0.5rem",
          padding: "0.6rem 1.4rem",
          border: "none",
          borderRadius: "999px",
          background: "#111",
          color: "#fff",
          fontSize: "0.95rem",
          cursor: "pointer",
        }}
      >
        {lang==="zh"?"重试":"Try again"}
      </button>
      <a href="/">{lang==="zh"?"返回首页":"Back to home"}</a>
    </main>
  );
}
