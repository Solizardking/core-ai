/**
 * Open Wallet Standard (OWS) integration for helius-cli.
 *
 * Provides helpers to detect the `ows` CLI, list wallets, and extract
 * Solana addresses.  Used by `helius wallet ows-link` and OWS-aware
 * command flags.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** True when the `ows` binary is reachable on PATH. */
export async function isOwsInstalled(): Promise<boolean> {
  try {
    await execFileAsync("ows", ["--version"], { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

/** Return parsed JSON from `ows wallet list --json`. */
export async function listOwsWallets(): Promise<
  Array<{ id: string; name: string; accounts?: Record<string, unknown> }>
> {
  const { stdout } = await execFileAsync("ows", ["wallet", "list", "--json"], {
    timeout: 10_000,
  });
  const parsed = JSON.parse(stdout);
  // The CLI may return { wallets: [...] } or a bare array.
  return Array.isArray(parsed) ? parsed : parsed.wallets ?? [];
}

/** Return the Solana address for the named OWS wallet. */
export async function getOwsSolanaAddress(
  walletName: string,
): Promise<string> {
  const { stdout } = await execFileAsync(
    "ows",
    ["wallet", "info", "--wallet", walletName, "--json"],
    { timeout: 10_000 },
  );
  const info = JSON.parse(stdout);

  const solanaKey = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
  const account =
    info.accounts?.[solanaKey] ??
    info.accounts?.solana ??
    Object.entries(info.accounts ?? {}).find(([k]) =>
      k.includes("solana"),
    )?.[1];

  if (!account) {
    throw new Error(
      `OWS wallet "${walletName}" has no Solana account. ` +
        `Run \`ows wallet info --wallet ${walletName}\` to inspect.`,
    );
  }

  const addr: string =
    typeof account === "string" ? account : (account as any).address;
  if (!addr) {
    throw new Error(
      `Could not extract Solana address from OWS wallet "${walletName}".`,
    );
  }
  return addr;
}
