"use client";

import { useEffect } from "react";

// Global client error boundary. Without this, any uncaught error in a Client
// Component (e.g. an API missing on some phone WebViews) renders a blank page,
// which is exactly the "tap the invite link and get kicked out" symptom.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
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
      <h1 style={{ fontSize: "1.25rem", margin: 0 }}>页面暂时无法显示</h1>
      <p style={{ margin: 0, color: "#666", maxWidth: "28rem" }}>
        你的浏览器在加载时遇到了问题。请重试；如果仍然不行，请换个浏览器或更新系统后再次打开邀请链接。
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
        重试
      </button>
    </main>
  );
}
