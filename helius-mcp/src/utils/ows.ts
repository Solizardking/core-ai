/**
 * Open Wallet Standard (OWS) integration.
 *
 * Provides an optional, additive signing path that delegates to the `ows` CLI
 * for policy-gated, key-isolated transaction signing.  When an `owsWallet`
 * parameter is supplied, transfers and staking tools use an OWS-backed signer
 * instead of the local keypair.  If OWS is not installed, callers get a clear
 * error — existing keypair flows are unaffected.
 *
 * The adapter implements the same duck-typed signer interface that @solana/kit
 * expects ({ address, signTransactions, signMessages }), so it plugs directly
 * into the Helius SDK's sendTransactionWithSender / sendSmartTransaction
 * without losing priority-fee estimation, SWQoS routing, or Jito tips.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { address, createKeyPairSignerFromBytes, type Address } from '@solana/kit';
import { loadSignerOrFail } from './helius.js';
import { mcpError } from './errors.js';

const execFileAsync = promisify(execFile);

// ── CLI helpers ──

/**
 * True when the `ows` binary is reachable on PATH.
 */
export async function isOwsInstalled(): Promise<boolean> {
  try {
    await execFileAsync('ows', ['--version'], { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Return the Solana address for the named OWS wallet.
 */
export async function getOwsSolanaAddress(walletName: string): Promise<string> {
  const { stdout } = await execFileAsync(
    'ows',
    ['wallet', 'info', '--wallet', walletName, '--json'],
    { timeout: 10_000 },
  );
  const info = JSON.parse(stdout);

  // The CLI outputs accounts keyed by CAIP-2 chain id.
  // Look for the Solana mainnet account.
  const solanaKey = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
  const account =
    info.accounts?.[solanaKey] ??
    info.accounts?.solana ??
    // Fallback: scan for any key containing "solana"
    Object.entries(info.accounts ?? {}).find(([k]) => k.includes('solana'))?.[1];

  if (!account) {
    throw new Error(
      `OWS wallet "${walletName}" has no Solana account.  ` +
      `Run \`ows wallet info --wallet ${walletName}\` to inspect.`,
    );
  }

  // Account may be a string (address) or an object with an address field.
  const addr: string = typeof account === 'string' ? account : account.address;
  if (!addr) {
    throw new Error(`Could not extract Solana address from OWS wallet "${walletName}".`);
  }
  return addr;
}

/**
 * Sign raw message bytes via OWS.  Returns the 64-byte Ed25519 signature.
 */
async function owsSignBytes(walletName: string, messageHex: string): Promise<Uint8Array> {
  const { stdout } = await execFileAsync(
    'ows',
    ['sign', 'message', '--wallet', walletName, '--chain', 'solana', '--message', messageHex, '--encoding', 'hex', '--json'],
    { timeout: 30_000 },
  );
  const result = JSON.parse(stdout);
  const sigHex: string = result.signature;
  if (!sigHex) {
    throw new Error('OWS sign returned no signature');
  }
  return Uint8Array.from(Buffer.from(sigHex, 'hex'));
}

// ── Signer adapter ──

/**
 * A duck-typed @solana/kit TransactionPartialSigner backed by OWS.
 *
 * Passes `isTransactionSigner()` checks and works with
 * `setTransactionMessageFeePayerSigner`, `signTransactionMessageWithSigners`,
 * `sendTransactionWithSender`, and `sendSmartTransaction`.
 *
 * IMPORTANT: `signTransactions` and `signMessages` return **partial signature
 * maps** (`{ [address]: signatureBytes }`), NOT full transaction/message objects.
 * This matches the contract that `@solana/kit`'s `signTransactionMessageWithSigners`
 * expects — it merges the partial maps back into the compiled transaction itself.
 */
export interface OwsSigner {
  address: Address;
  signTransactions: (
    transactions: readonly { messageBytes: Uint8Array }[],
  ) => Promise<readonly Record<string, Uint8Array>[]>;
  signMessages: (
    messages: readonly { content: Uint8Array }[],
  ) => Promise<readonly Record<string, Uint8Array>[]>;
}

// ── Shared signer resolution ──

/**
 * Resolve a signer from an OWS wallet name or the local Helius keypair.
 * Returns a result-union so callers can return the MCP error directly.
 *
 * The returned `signer` is typed as `any` to avoid @solana/kit branded-type
 * friction — it satisfies `isTransactionSigner()` at runtime.
 */
export async function resolveOwsOrKeypairSigner(owsWallet?: string): Promise<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { ok: true; signer: any; walletAddress: string; owsWallet?: string }
  | { ok: false; error: ReturnType<typeof mcpError> }
> {
  if (owsWallet) {
    if (!await isOwsInstalled()) {
      return { ok: false, error: mcpError(
        'OWS CLI is not installed. Install it with `curl -fsSL https://docs.openwallet.sh/install.sh | bash` or `npm install -g @open-wallet-standard/core`.',
        { type: 'AUTH', code: 'OWS_NOT_INSTALLED', retryable: false, recovery: 'Install the OWS CLI, then retry.' },
      ) };
    }
    try {
      const signer = await createOwsSigner(owsWallet);
      return { ok: true, signer, walletAddress: signer.address, owsWallet };
    } catch (err: any) {
      return { ok: false, error: mcpError(
        `Failed to load OWS wallet "${owsWallet}": ${err.message}`,
        { type: 'AUTH', code: 'OWS_WALLET_ERROR', retryable: false, recovery: 'Run `ows wallet list` to see available wallets.' },
      ) };
    }
  }

  try {
    const signerData = await loadSignerOrFail();
    const signer = await createKeyPairSignerFromBytes(signerData.secretKey);
    return { ok: true, signer, walletAddress: signerData.walletAddress };
  } catch {
    return { ok: false, error: mcpError(
      'No keypair found. Call `generateKeypair` first to create a wallet.',
      { type: 'AUTH', code: 'NO_KEYPAIR', retryable: false, recovery: 'Call `generateKeypair` to create a wallet.' },
    ) };
  }
}

export async function createOwsSigner(walletName: string): Promise<OwsSigner> {
  const solAddress = await getOwsSolanaAddress(walletName);
  const addr = address(solAddress);

  return {
    address: addr,

    async signTransactions(
      transactions: readonly { messageBytes: Uint8Array }[],
    ): Promise<readonly Record<string, Uint8Array>[]> {
      return Promise.all(
        transactions.map(async (tx) => {
          const msgHex = Buffer.from(tx.messageBytes).toString('hex');
          const sig = await owsSignBytes(walletName, msgHex);
          return { [addr]: sig };
        }),
      );
    },

    async signMessages(
      messages: readonly { content: Uint8Array }[],
    ): Promise<readonly Record<string, Uint8Array>[]> {
      return Promise.all(
        messages.map(async (msg) => {
          const hex = Buffer.from(msg.content).toString('hex');
          const sig = await owsSignBytes(walletName, hex);
          return { [addr]: sig };
        }),
      );
    },
  };
}
