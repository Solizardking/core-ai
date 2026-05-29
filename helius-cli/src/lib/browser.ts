import { spawn } from "node:child_process";

/**
 * Opens `url` in the user's default browser. Detached + unref'd so the CLI
 * doesn't wait on it. Returns false if the platform launcher couldn't spawn.
 */
export function openInBrowser(url: string): boolean {
  const platform = process.platform;
  const cmd = platform === "darwin" ? "open" : platform === "win32" ? "cmd" : "xdg-open";
  const args = platform === "win32" ? ["/c", "start", "\"\"", url] : [url];
  try {
    const child = spawn(cmd, args, { detached: true, stdio: "ignore" });
    child.unref();
    return true;
  } catch {
    return false;
  }
}
