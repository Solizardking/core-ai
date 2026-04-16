import chalk from "chalk";
import { address } from "@solana/kit";
import { getCloseAccountInstruction } from "@solana-program/token";
import { setupClient, type ResolveOptions } from "../lib/helius.js";
import { loadKeypairFromFile, getAddress } from "../lib/wallet.js";
import { formatSol } from "../lib/formatters.js";
import {
  outputJson,
  exitWithError,
  handleCommandError,
  createSpinner,
  withRetry,
  confirm,
  isAgent,
  type OutputOptions,
  type RetryOptions,
} from "../lib/output.js";

const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

// Conservative default: stays well under the 1232-byte tx size cap for v0 txs
// even after compute-budget ixs, priority fee, and the Sender tip transfer are
// prepended. Users can override with --batch-size.
const DEFAULT_BATCH_SIZE = 20;

interface ReclaimOptions extends OutputOptions, ResolveOptions, RetryOptions {
  keypair?: string;
  destination?: string;
  region?: string;
  swqosOnly?: boolean;
  tipAmount?: string;
  batchSize?: string;
  limit?: string;
  dryRun?: boolean;
  yes?: boolean;
}

interface ClosableAta {
  address: string;
  mint: string;
  lamports: number;
}

export async function reclaimCommand(
  ownerArg: string | undefined,
  options: ReclaimOptions = {},
): Promise<void> {
  const spinner = createSpinner(options);
  try {
    // Load signer. Always required for a real run; optional in dry-run if
    // an explicit owner address is provided (useful for auditing a wallet).
    let signer: any = null;
    let signerAddress: string | null = null;

    if (options.keypair) {
      try {
        signer = await loadKeypairFromFile(options.keypair);
        signerAddress = await getAddress(signer);
      } catch (e) {
        const needSigner = !options.dryRun || !ownerArg;
        if (needSigner) {
          exitWithError(
            "KEYPAIR_NOT_FOUND",
            (e as Error).message,
            undefined,
            !!options.json,
          );
        }
      }
    }

    const owner = ownerArg ?? signerAddress;
    if (!owner) {
      exitWithError(
        "KEYPAIR_NOT_FOUND",
        "Provide an owner address as an argument or a keypair with -k.",
        undefined,
        !!options.json,
      );
    }

    // Fetch token accounts (legacy SPL Token program only for v1).
    const helius = await setupClient(
      spinner,
      options,
      `Scanning token accounts for ${owner}...`,
    );
    const accounts: any[] = await withRetry(
      () =>
        helius.getAllTokenAccountsByOwner(
          owner as any,
          { programId: TOKEN_PROGRAM_ID },
          { encoding: "jsonParsed" as any },
        ),
      options,
      spinner,
    ) as any;

    // Filter closable accounts.
    const closable: ClosableAta[] = [];
    let frozenSkipped = 0;
    let nonEmptySkipped = 0;
    let authoritySkipped = 0;

    for (const a of accounts) {
      const info = (a.account?.data as any)?.parsed?.info;
      if (!info) continue;
      if (info.state === "frozen") {
        frozenSkipped++;
        continue;
      }
      const amount = info.tokenAmount?.amount ?? "0";
      if (amount !== "0") {
        nonEmptySkipped++;
        continue;
      }
      // If closeAuthority is set, it must equal the signer to be closable by us.
      // (We still count the skip in dry-run-without-signer mode, where signerAddress
      // is null; those are informational-only.)
      const closeAuth: string | null | undefined = info.closeAuthority;
      if (closeAuth && signerAddress && closeAuth !== signerAddress) {
        authoritySkipped++;
        continue;
      }
      closable.push({
        address: a.pubkey,
        mint: info.mint,
        lamports: a.account.lamports,
      });
    }

    // Apply --limit cap.
    const limit = options.limit ? parseInt(options.limit, 10) : undefined;
    const toClose =
      limit && limit > 0 ? closable.slice(0, limit) : closable;
    const totalReclaimable = toClose.reduce((sum, a) => sum + a.lamports, 0);

    // Build batches.
    const batchSize = Math.max(
      1,
      options.batchSize ? parseInt(options.batchSize, 10) : DEFAULT_BATCH_SIZE,
    );
    const batches: ClosableAta[][] = [];
    for (let i = 0; i < toClose.length; i += batchSize) {
      batches.push(toClose.slice(i, i + batchSize));
    }

    spinner?.stop();

    // Dry-run path — no signer required, no broadcast.
    if (options.dryRun) {
      if (options.json) {
        outputJson({
          dryRun: true,
          owner,
          closable: toClose.length,
          totalReclaimableLamports: totalReclaimable,
          totalReclaimableSol: totalReclaimable / 1_000_000_000,
          batches: batches.length,
          batchSize,
          region: options.region || "Default",
          swqosOnly: !!options.swqosOnly,
          note: "Token-2022 accounts are not scanned in v1.",
          skipped: {
            frozen: frozenSkipped,
            nonEmpty: nonEmptySkipped,
            closeAuthorityMismatch: authoritySkipped,
          },
          accounts: toClose,
        });
        return;
      }

      console.log(
        chalk.bold(`\nReclaim (dry-run) for ${chalk.cyan(owner)}:\n`),
      );
      console.log(
        `  ${chalk.gray("Closable ATAs:")} ${chalk.green(toClose.length)}`,
      );
      console.log(
        `  ${chalk.gray("Total reclaimable:")} ${chalk.green(formatSol(totalReclaimable))}`,
      );
      console.log(
        `  ${chalk.gray("Transactions:")} ${chalk.green(batches.length)} (batch size ${batchSize}, Sender region ${options.region || "Default"})`,
      );
      if (frozenSkipped) {
        console.log(
          chalk.yellow(`  Skipped ${frozenSkipped} frozen account(s)`),
        );
      }
      if (nonEmptySkipped) {
        console.log(
          chalk.gray(
            `  Ignored ${nonEmptySkipped} non-empty account(s) (have balances)`,
          ),
        );
      }
      if (authoritySkipped) {
        console.log(
          chalk.yellow(
            `  Skipped ${authoritySkipped} account(s) (closeAuthority does not match keypair)`,
          ),
        );
      }
      console.log(
        chalk.gray("  Token-2022 accounts are not scanned in v1."),
      );
      if (toClose.length) {
        console.log("");
        const preview = toClose.slice(0, 10);
        for (const ata of preview) {
          console.log(
            `  ${chalk.cyan(ata.address)}  mint=${chalk.gray(ata.mint)}  rent=${formatSol(ata.lamports)}`,
          );
        }
        if (toClose.length > preview.length) {
          console.log(
            chalk.gray(`  ... and ${toClose.length - preview.length} more`),
          );
        }
      }
      return;
    }

    // Real run — require signer and owner match.
    if (!signer || !signerAddress) {
      exitWithError(
        "KEYPAIR_NOT_FOUND",
        "Reclaim requires a keypair. Use -k <path> or run `helius keygen`.",
        undefined,
        !!options.json,
      );
    }
    if (signerAddress !== owner) {
      exitWithError(
        "INVALID_INPUT",
        `Keypair address (${signerAddress}) does not match owner (${owner}). Only the owner can close their token accounts.`,
        undefined,
        !!options.json,
      );
    }

    if (toClose.length === 0) {
      if (options.json) {
        outputJson({
          closed: 0,
          reclaimedLamports: 0,
          message: "No empty ATAs found",
        });
        return;
      }
      console.log(
        chalk.yellow(`\nNo empty token accounts to close for ${owner}.`),
      );
      return;
    }

    // Confirmation prompt — TTY only.
    if (!options.yes && !options.json && !isAgent) {
      console.log(
        chalk.bold(
          `\nAbout to close ${toClose.length} empty token account(s):`,
        ),
      );
      console.log(
        `  ${chalk.gray("Reclaim:")} ~${formatSol(totalReclaimable)}`,
      );
      console.log(
        `  ${chalk.gray("Transactions:")} ${batches.length} (batch size ${batchSize}, Sender region ${options.region || "Default"})`,
      );
      console.log(
        `  ${chalk.gray("Destination:")} ${options.destination || signerAddress}`,
      );
      const ok = await confirm(chalk.yellow("\n  Proceed? (y/N) "));
      if (!ok) {
        console.log(chalk.gray("  Cancelled."));
        return;
      }
    }

    const destination = address(options.destination || signerAddress);
    const region = (options.region || "Default") as any;
    const senderOpts: Record<string, unknown> = { region };
    if (options.swqosOnly) senderOpts.swqosOnly = true;
    if (options.tipAmount) {
      senderOpts.tipAmount = parseInt(options.tipAmount, 10);
    }

    type BatchResult =
      | {
          ok: true;
          batchIndex: number;
          signature: string;
          closed: number;
          reclaimedLamports: number;
        }
      | {
          ok: false;
          batchIndex: number;
          attempted: number;
          error: string;
        };

    const results: BatchResult[] = [];

    // Send batches. Continue-on-error: a failed batch does not abort later ones.
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchReclaimed = batch.reduce((sum, a) => sum + a.lamports, 0);
      const instructions = batch.map((a) =>
        getCloseAccountInstruction({
          account: address(a.address),
          destination,
          owner: signer,
        } as any),
      );

      spinner?.start(
        `Closing batch ${i + 1}/${batches.length} (${batch.length} account${batch.length === 1 ? "" : "s"}) via Sender...`,
      );
      try {
        const signature: string = await withRetry(
          () =>
            (helius as any).tx.sendTransactionWithSender({
              signers: [signer],
              instructions,
              ...senderOpts,
            }),
          options,
          spinner,
        ) as any;
        results.push({
          ok: true,
          batchIndex: i + 1,
          signature,
          closed: batch.length,
          reclaimedLamports: batchReclaimed,
        });
        spinner?.succeed(
          `Batch ${i + 1}/${batches.length} landed: ${chalk.cyan(signature)}`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({
          ok: false,
          batchIndex: i + 1,
          attempted: batch.length,
          error: msg,
        });
        spinner?.fail(`Batch ${i + 1}/${batches.length} failed: ${msg}`);
      }
    }

    // Summarize.
    const successes = results.filter((r): r is Extract<BatchResult, { ok: true }> => r.ok);
    const failures = results.filter((r): r is Extract<BatchResult, { ok: false }> => !r.ok);
    const closedCount = successes.reduce((sum, r) => sum + r.closed, 0);
    const reclaimedLamports = successes.reduce(
      (sum, r) => sum + r.reclaimedLamports,
      0,
    );

    if (options.json) {
      outputJson({
        owner,
        destination: String(destination),
        region: options.region || "Default",
        swqosOnly: !!options.swqosOnly,
        batchSize,
        totalBatches: batches.length,
        closed: closedCount,
        reclaimedLamports,
        reclaimedSol: reclaimedLamports / 1_000_000_000,
        successes,
        failures,
      });
      return;
    }

    console.log(chalk.bold("\nReclaim complete:\n"));
    console.log(
      `  ${chalk.gray("Closed:")} ${chalk.green(closedCount)} / ${toClose.length} account(s)`,
    );
    console.log(
      `  ${chalk.gray("Reclaimed:")} ${chalk.green(formatSol(reclaimedLamports))}`,
    );
    console.log(
      `  ${chalk.gray("Batches:")} ${successes.length} succeeded, ${failures.length} failed`,
    );
    if (failures.length) {
      console.log(chalk.yellow("\n  Failed batches:"));
      for (const f of failures) {
        console.log(
          `    ${chalk.red(`Batch ${f.batchIndex}`)} (${f.attempted} account${f.attempted === 1 ? "" : "s"}): ${f.error}`,
        );
      }
      console.log(
        chalk.gray(
          "\n  Re-run the command to retry. Successful batches are already on-chain.",
        ),
      );
    }
  } catch (error) {
    handleCommandError(error, options, spinner);
  }
}
