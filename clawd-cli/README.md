# Clawd CLI

Official command-line interface for [Helius](https://helius.dev) — the leading Solana RPC and API provider. Built for developers and LLM agents.

## v1.3.0 migration notes

Every `--json` response is now wrapped in a uniform envelope. **This is a breaking change** for consumers parsing the pre-1.3 shapes, but is shipped as a minor bump — confirm your integrations before upgrading.

Two breakage axes:

1. **Top-level shape changed.** Success output is wrapped in `{ ok: true, v: 1, data }`. Error output is wrapped in `{ ok: false, v: 1, error_code, category, error, recoverable, suggestion?, details? }`. Error field renames: `error → error_code`, `message → error`, `retryable → recoverable`, `guidance → suggestion`.
2. **Caller-supplied error details are now nested under `details`.** Commands that previously spread extra fields inline on errors (e.g. `{ ..., projects: [...] }` from `apikeys` on `MULTIPLE_PROJECTS`) now put them under `response.details.projects`.

See [Output Format](#output-format) for the full contract. Streaming commands (`clawd-cli ws ...`) are unchanged — they emit line-delimited `{ event, timestamp, data }` events, not envelopes.

## Installation

```bash
npm install -g clawd-cli
# or
pnpm add -g clawd-cli
```

## Quick Start

### Existing Helius users

If you already have an API key, just set it:

```bash
clawd-cli config set-api-key <your-api-key>
```

Get your key from [dashboard.helius.dev](https://dashboard.helius.dev).

### New users — create an account

The default flow returns a hosted-checkout link. Open it in a browser, pay USDC, then resume the CLI to provision your API key.

```bash
# 1. Generate a keypair (auto-runs on first signup if missing)
clawd-cli keygen

# 2. Start signup — prints a payment URL and exits.
clawd-cli signup --email you@example.com --first-name Jane --last-name Doe

# 3. Open the URL in a browser, pay USDC. Then back in the terminal:
clawd-cli signup --resume

# 4. Start querying
clawd-cli balance <wallet-address>
clawd-cli tx parse <signature>
```

Default plan: `agent` — $10 USDC one-time, 1,000,000 starting credits. Pass `--plan developer` ($49/mo), `--plan business` ($499/mo), or `--plan professional` ($999/mo) for subscription tiers (with optional `--period yearly`).

#### Auto-pay (CLI keypair pays for itself)

Skip the browser — let the CLI keypair send USDC + memo directly to the treasury and poll activation:

```bash
clawd-cli signup --pay --email you@example.com --first-name Jane --last-name Doe
```

The wallet needs ~0.001 SOL for fees and the plan amount in USDC. On poll timeout the CLI prints `PENDING` with the `txSignature` so you can resume later.

#### Pending intent reuse

Re-running `clawd-cli signup` after starting a signup re-prints the same payment link — no duplicate intents are created. To start over, pass `--restart`. To keep polling without sending another USDC tx, pass `--resume` (does not load the keypair, does not require contact args).

## Configuration

Config and keypair are stored under `~/.clawd/`:

```
~/.clawd/
├── config.json    # API key, JWT, network, default project
└── keypair.json   # Solana keypair (if generated with keygen)
```

API keys are resolved in this order:

1. `--api-key <key>` flag
2. `HELIUS_API_KEY` environment variable
3. `~/.clawd/config.json` (legacy `~/.helius/config.json` is still read)

```bash
clawd-cli config show                # View current config
clawd-cli config set-api-key <key>  # Set API key
clawd-cli config set-network devnet # Switch to devnet
clawd-cli config set-project <id>   # Set default project
clawd-cli config clear               # Reset config
```

## Commands

### Account Management

| Command | Description |
|---|---|
| `clawd-cli keygen` | Generate a new Solana keypair |
| `clawd-cli signup` | Create a Helius account via crypto checkout (default: agent $10 one-time; `--pay` for autopay, `--resume` to finish) |
| `clawd-cli login` | Authenticate with an existing wallet |
| `clawd-cli upgrade --plan <name>` | Upgrade to a paid plan |
| `clawd-cli pay <payment-intent-id>` | Pay a renewal or pending payment intent |
| `clawd-cli projects` | List all projects |
| `clawd-cli project [id]` | Get project details |
| `clawd-cli apikeys [project-id]` | List API keys |
| `clawd-cli apikeys create [project-id]` | Create a new API key |
| `clawd-cli usage [project-id]` | Show credits usage |
| `clawd-cli status` | Show account status: plan, credits, billing cycle |
| `clawd-cli plans` | List available Helius plans and pricing |
| `clawd-cli rpc [project-id]` | Show RPC endpoints |

### Balances & Tokens

| Command | Description |
|---|---|
| `clawd-cli balance <address>` | Get native SOL balance |
| `clawd-cli tokens <address>` | Get fungible token balances |
| `clawd-cli token-holders <mint>` | Get top holders of a token |

### Transactions

| Command | Description |
|---|---|
| `clawd-cli tx parse <signatures...>` | Parse transactions into human-readable format |
| `clawd-cli tx history <address>` | Get enhanced transaction history |
| `clawd-cli tx fees` | Get priority fee estimates |

### Digital Assets (DAS API)

| Command | Description |
|---|---|
| `clawd-cli asset get <id>` | Get asset by mint address |
| `clawd-cli asset batch <ids...>` | Get multiple assets |
| `clawd-cli asset owner <address>` | Get assets by owner |
| `clawd-cli asset creator <address>` | Get assets by creator |
| `clawd-cli asset authority <address>` | Get assets by authority |
| `clawd-cli asset collection <address>` | Get assets in a collection |
| `clawd-cli asset search` | Search assets with filters |
| `clawd-cli asset proof <id>` | Get Merkle proof for a compressed NFT |
| `clawd-cli asset proof-batch <ids...>` | Get Merkle proofs for multiple compressed NFTs |
| `clawd-cli asset editions <mint>` | Get NFT editions |
| `clawd-cli asset signatures <id>` | Get transaction signatures for an asset |
| `clawd-cli asset token-accounts` | Query token accounts by owner/mint |

### Account & Network

| Command | Description |
|---|---|
| `clawd-cli account <address>` | Get Solana account info |
| `clawd-cli network-status` | Get Solana network status |
| `clawd-cli block <slot>` | Get block details |

### Wallet API

| Command | Description |
|---|---|
| `clawd-cli wallet identity <address-or-domain>` | Look up wallet identity (address or SNS/ANS domain) |
| `clawd-cli wallet identity-batch <entries...>` | Look up identities for multiple wallets (addresses and/or domains) |
| `clawd-cli wallet balances <address>` | Get all token balances with USD values |
| `clawd-cli wallet history <address>` | Get transaction history with balance changes |
| `clawd-cli wallet transfers <address>` | Get token transfers |
| `clawd-cli wallet funded-by <address>` | Find original funding source |

### Webhooks

| Command | Description |
|---|---|
| `clawd-cli webhook list` | List all webhooks |
| `clawd-cli webhook get <id>` | Get webhook details |
| `clawd-cli webhook create` | Create a webhook (`--url`, `--accounts`, `--types` required) |
| `clawd-cli webhook update <id>` | Update a webhook |
| `clawd-cli webhook delete <id>` | Delete a webhook |

### Program Accounts

| Command | Description |
|---|---|
| `clawd-cli program accounts <program-id>` | Get accounts owned by a program |
| `clawd-cli program accounts-all <program-id>` | Get all accounts (auto-paginate) |
| `clawd-cli program token-accounts <owner>` | Get token accounts by owner |

### Staking

| Command | Description |
|---|---|
| `clawd-cli stake create <amount>` | Create a stake transaction (SOL) |
| `clawd-cli stake unstake <stake-account>` | Create an unstake transaction |
| `clawd-cli stake withdraw <stake-account>` | Create a withdraw transaction |
| `clawd-cli stake accounts <wallet>` | Get Helius stake accounts for a wallet |
| `clawd-cli stake withdrawable <stake-account>` | Get withdrawable amount |
| `clawd-cli stake instructions <amount>` | Get stake instructions |

### ZK Compression

| Command | Description |
|---|---|
| `clawd-cli zk account <address>` | Get compressed account |
| `clawd-cli zk accounts-by-owner <owner>` | Get compressed accounts by owner |
| `clawd-cli zk balance <address>` | Get compressed balance |
| `clawd-cli zk token-holders <mint>` | Get compressed token holders |
| `clawd-cli zk proof <address>` | Get compressed account proof |
| `clawd-cli zk proofs <addresses...>` | Get multiple proofs |
| `clawd-cli zk validity-proof` | Get validity proof |
| `clawd-cli zk tx <signature>` | Get transaction with compression info |
| `clawd-cli zk indexer-health` | Check ZK indexer health |
| *(+ more zk subcommands)* | `clawd-cli zk --help` for the full list |

### Transaction Sending

| Command | Description |
|---|---|
| `clawd-cli send broadcast <base64-tx>` | Broadcast a signed transaction and poll for confirmation |
| `clawd-cli send raw <base64-tx>` | Send a raw transaction |
| `clawd-cli send sender <base64-tx>` | Send via Helius Sender for ultra-low latency |
| `clawd-cli send poll <signature>` | Poll transaction status until confirmed |
| `clawd-cli send compute-units <base64-tx>` | Simulate and return compute unit estimate |

### WebSocket Streaming

| Command | Description |
|---|---|
| `clawd-cli ws account <address>` | Stream account change notifications |
| `clawd-cli ws logs` | Stream log notifications |
| `clawd-cli ws slot` | Stream slot notifications |
| `clawd-cli ws signature <sig>` | Stream signature confirmation |
| `clawd-cli ws program <program-id>` | Stream program account change notifications |

### SIMDs

| Command | Description |
|---|---|
| `clawd-cli simd list` | List all SIMD proposals |
| `clawd-cli simd get <number>` | Read a specific SIMD |

## Global Options

All commands accept:

| Option | Description |
|---|---|
| `--api-key <key>` | Override the configured API key |
| `--network <net>` | Network: `mainnet` or `devnet` (default: `mainnet`) |
| `--json` | Output in JSON format (machine-readable) |

Keypair commands (`signup`, `login`, `upgrade`, `pay`, `stake`) also accept:

| Option | Description |
|---|---|
| `-k, --keypair <path>` | Path to Solana keypair file (default: `~/.clawd/keypair.json`) |

## NO_DNA Support

Clawd CLI supports the [NO_DNA](https://no-dna.org) convention. When the `NO_DNA` environment variable is set, the CLI adapts its behavior for non-human callers:
- **Spinners suppressed** — no terminal animations polluting agent output
- **Interactive prompts return preview** — commands that require confirmation (`upgrade`, `pay`) exit with a JSON preview instead of hanging on stdin; pass `--yes` to skip confirmation

## Exit Codes

| Code | Meaning | Retryable |
|---|---|---|
| 0 | Success | — |
| 1 | General error | — |
| 10 | Not logged in | No |
| 11 | Keypair not found | No |
| 20 | Insufficient SOL | No |
| 21 | Insufficient USDC | No |
| 30 | No projects found | No |
| 31 | Project not found | No |
| 40 | API error | No |
| 50 | No API key configured | No |
| 52 | Invalid address | No |
| 53 | Invalid input (HTTP 400) | No |
| 54 | Invalid API key (HTTP 401/403) | No |
| 55 | Not found (HTTP 404) | No |
| 56 | Rate limited (HTTP 429) | **Yes** |
| 57 | Server error (HTTP 5xx) | **Yes** |
| 58 | Network error (connection failed) | **Yes** |

All `--json` error envelopes include a `recoverable` field (same meaning as the pre-1.3 `retryable`).

## Output Format

When `--json` is passed, every single-response command emits a uniform envelope on `stdout` (both success and failure), so `clawd-cli <cmd> --json | jq '.ok'` works the same for either outcome. Human-mode errors continue to print to `stderr` via spinners and `console.error`.

### Success

```json
{
  "ok": true,
  "v": 1,
  "data": { "address": "...", "lamports": 12345, "sol": 0.000012345, "network": "mainnet" }
}
```

`data` holds whatever the command previously emitted at the top level.

### Error

```json
{
  "ok": false,
  "v": 1,
  "error_code": "MULTIPLE_PROJECTS",
  "category": "project",
  "error": "Multiple projects found — specify one with --project <id>.",
  "recoverable": false,
  "suggestion": "Specify a project ID. Run `clawd-cli projects` to list them.",
  "details": { "projects": [{ "id": "...", "name": "..." }] }
}
```

Fields:

- `ok` — `true` on success, `false` on failure. Always present.
- `v` — envelope schema version. Always `1` in this release. Branch on this for forward compatibility.
- `data` (success only) — the command's payload.
- `error_code` (error only) — stable machine identifier (e.g. `INVALID_API_KEY`, `RATE_LIMITED`). Safe to `switch` on.
- `category` (error only) — coarse bucket; one of: `success`, `general`, `auth`, `payment`, `project`, `api`, `sdk`, `validation`, `not_found`, `rate_limit`, `server`, `network`. Use this when you want to group errors without enumerating every code.
- `error` (error only) — human-readable message.
- `recoverable` (error only) — `true` if retrying may succeed (rate limits, transient 5xx, network). `false` for permanent errors like invalid address or invalid API key.
- `suggestion` (error only, always present) — a short actionable next step for the given error code.
- `details` (error only, optional) — extra structured context (e.g. `projects` list for `MULTIPLE_PROJECTS`, `missing` array for `INSUFFICIENT_FUNDS`). Under `--debug`, also includes a `stack` field for unclassified errors.

Envelope keys are intentionally `snake_case` (`error_code`, not `errorCode`) for ergonomic shell use — `jq '.error_code'` reads naturally. Internal TypeScript names elsewhere in the codebase still use `camelCase`.

TypeScript consumers can import the envelope types from the installed package:

```ts
import type { Envelope, SuccessEnvelope, ErrorEnvelope, Category } from "clawd-cli/dist/lib/output.js";
```

### Streaming exception

`clawd-cli ws <subcommand> --json` emits line-delimited events of the form `{ event, timestamp, data }` and does **not** use the envelope. A consumer that calls `JSON.parse(line).ok` on a streaming line gets `undefined`, which is the tell that it's an event, not a single response. Validation errors from `ws` commands (e.g. bad pubkey) still use the envelope.

## Development

This package lives inside the [core-ai monorepo](https://github.com/Solizardking/core-ai):

```bash
git clone https://github.com/Solizardking/core-ai
cd core-ai/clawd-cli
pnpm install
pnpm dev keygen   # Run a command in watch mode
pnpm build        # Compile TypeScript → dist/
```

## License

MIT
