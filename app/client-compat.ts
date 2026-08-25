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

// Safe storage access. Some in-app WebViews (private mode, strict ITP) throw
// a SecurityError on direct localStorage/sessionStorage access, which would
// crash the component on mount. These never throw.
export function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — ignore */
  }
}
export function storageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable — ignore */
  }
}
export function sessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
export function sessionSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* storage unavailable — ignore */
  }
}

// Safe URL query parsing for WebViews that predate URLSearchParams
// (Android 5.x system WebView, older X5 kernels). Returns decoded key->value map.
export function parseQuery(search: string): Record<string, string> {
  const out: Record<string, string> = {};
  const s = search.startsWith("?") ? search.slice(1) : search;
  if (!s) return out;
  for (const pair of s.split("&")) {
    if (!pair) continue;
    const i = pair.indexOf("=");
    const k = i < 0 ? pair : pair.slice(0, i);
    const v = i < 0 ? "" : pair.slice(i + 1);
    try {
      out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, " "));
    } catch {
      out[k] = v;
    }
  }
  return out;
}
