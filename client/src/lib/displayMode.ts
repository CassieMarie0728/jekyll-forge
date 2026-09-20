import { useEffect, useState } from "react";
export type DisplayMode = "auto" | "desktop";
const key = "jekyll-forge-display-mode";
const event = "forge-display-mode";
export function getDisplayMode(): DisplayMode {
  try {
    return localStorage.getItem(key) === "desktop" ? "desktop" : "auto";
  } catch {
    return "auto";
  }
}
export function applyDisplayMode(mode: DisplayMode) {
  document
    .querySelector('meta[name="viewport"]')
    ?.setAttribute(
      "content",
      mode === "desktop"
        ? "width=1280"
        : "width=device-width, initial-scale=1.0"
    );
}
export function useDisplayMode() {
  const [mode, setMode] = useState<DisplayMode>(getDisplayMode);
  useEffect(() => {
    const update = (e: Event) =>
      setMode((e as CustomEvent<DisplayMode>).detail);
    window.addEventListener(event, update);
    return () => window.removeEventListener(event, update);
  }, []);
  return [
    mode,
    (next: DisplayMode) => {
      try {
        localStorage.setItem(key, next);
      } catch {
        /* Still apply for this page. */
      }
      applyDisplayMode(next);
      setMode(next);
      window.dispatchEvent(new CustomEvent(event, { detail: next }));
    },
  ] as const;
}
