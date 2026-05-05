import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "system" | "light" | "dark";

const THEME_KEY = "smart-dorm-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  return mode === "system" ? getSystemTheme() : mode;
}

function loadThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark" || stored === "system")
      return stored;
  } catch {
    // ignore
  }
  return "system";
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(loadThemeMode);
  const [resolved, setResolved] = useState<"light" | "dark">(() =>
    resolveTheme(loadThemeMode()),
  );

  const applyTheme = useCallback((m: ThemeMode) => {
    const r = resolveTheme(m);
    setResolved(r);
    document.documentElement.setAttribute("data-theme", r);
  }, []);

  const setMode = useCallback(
    (m: ThemeMode) => {
      setModeState(m);
      localStorage.setItem(THEME_KEY, m);
      applyTheme(m);
    },
    [applyTheme],
  );

  const cycleTheme = useCallback(() => {
    setMode(mode === "system" ? "light" : mode === "light" ? "dark" : "system");
  }, [mode, setMode]);

  // Apply on mount
  useEffect(() => {
    applyTheme(mode);
  }, [applyTheme, mode]);

  // Listen for system preference changes when mode is 'system'
  useEffect(() => {
    if (mode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [mode, applyTheme]);

  return { mode, resolved, setMode, cycleTheme };
}
