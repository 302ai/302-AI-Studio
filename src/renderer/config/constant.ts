export const platform = window.electron?.process?.platform;
export const isMac = platform === "darwin";
export const isWindows = platform === "win32" || platform === "win64";
export const isLinux = platform === "linux";
export const isDev = process.env.NODE_ENV === "development";

export const PLATFORM_KEY_MAP: Record<string, string> = {
  Cmd: isMac ? "⌘" : "Ctrl",
  Meta: isMac ? "⌘" : "Win",
  Alt: isMac ? "⌥" : "Alt",
  Shift: isMac ? "⇧" : "Shift",
  Control: isMac ? "⌃" : "Ctrl",
  Enter: "Enter",
  Backspace: isMac ? "⌫" : "Backspace",
  Delete: isMac ? "⌦" : "Delete",
  Tab: isMac ? "⇥" : "Tab",
  Escape: isMac ? "⎋" : "Esc",
  Space: "Space",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
};

export function formatShortcutKeys(keys: string[]): string {
  return keys.map((key) => PLATFORM_KEY_MAP[key] || key).join(isMac ? "" : "+");
}

export function formatShortcutLabel(keys: string[]): string {
  const formattedKeys = keys.map((key) => PLATFORM_KEY_MAP[key] || key);
  return formattedKeys.join("+");
}
