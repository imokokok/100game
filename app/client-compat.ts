// Device-compatibility helpers for client components.
//
// Some mobile WebViews (older Android system WebView, certain in-app browsers
// such as WeChat's X5 kernel on specific phone models) do not implement the
// `queueMicrotask` global or the async Clipboard API. Calling them directly
// throws and crashes the whole page on those devices — which is exactly the
// "tap the invite link and get kicked out / can't get in" symptom reported.

export function runMicrotask(task: () => void): void {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(task);
  } else {
    Promise.resolve().then(task);
  }
}

// Safe String.prototype.replaceAll for WebViews (older X5/Android) that
// predate it (Chrome < 85 / Safari < 13.1). Used on the render path.
export function replaceAllText(text: string, search: string, replacement: string): string {
  if (typeof text.replaceAll === "function") return text.replaceAll(search, replacement);
  return text.split(search).join(replacement);
}

// Copy text to the clipboard. Returns true on success.
// Falls back to the legacy execCommand("copy") path for WebViews that lack
// navigator.clipboard (or block it in an insecure / in-app context).
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path below
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
