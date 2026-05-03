export type AppTheme = "light" | "dark";

export const lightTheme = {
  background: "#f8fafc",
  foreground: "#111827",

  card: "#ffffff",
  border: "#e5e7eb",

  primary: "#1e88ff",
  primaryForeground: "#ffffff",

  muted: "#64748b",
  mutedForeground: "#64748b",

  success: "#16a34a",
  danger: "#dc2626",
  warning: "#f59e0b",
};

export const darkTheme = {
  background: "#0f172a",
  foreground: "#e6edf7",

  card: "#0f172a",
  border: "#1e293b",

  primary: "#1e88ff",
  primaryForeground: "#ffffff",

  muted: "#7c8aa6",
  mutedForeground: "#94a3b8",

  success: "#22c55e",
  danger: "#ef4444",
  warning: "#fbbf24",
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};

export function getTheme(theme: AppTheme) {
  return themes[theme];
}