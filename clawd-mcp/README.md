# Clawd MCP Server

Clawd Core MCP server — Solana blockchain data for AI assistants via Helius RPC, DAS, Sender, and streaming.

See the [CHANGELOG](https://github.com/Solizardking/core-ai/blob/main/clawd-mcp/CHANGELOG.md) for version history and release notes.

Interested in contributing? Read the [contribution guide](https://github.com/Solizardking/core-ai/blob/main/clawd-mcp/CONTRIBUTING.md) before opening a PR.

## Quick Start

### 1. Add the MCP server

Add to your MCP host's config (works with Clawd, Cursor, Windsurf, and any MCP-compatible client):

```json
{
  "mcpServers": {
    "clawd": {
      "command": "npx",
      "args": ["clawd-mcp@latest"]
    }
  }
}
```

Or if you're using Clawd Code:

```bash
npx clawd-mcp@latest  # configure in .clawd/settings.json or your MCP client
```

### 2. Configure your API key

**If you already have a Helius API key:**

```bash
export HELIUS_API_KEY=your-api-key
```

Or set it from your AI assistant by calling the `setHeliusApiKey` tool.

**If you need a new account:**

The MCP includes a `signup` tool with three modes:

1. Call the `generateKeypair` tool — it creates a Solana wallet and returns the address
2. Call `signup` with `mode: "link"` — returns a `paymentUrl` (e.g. `https://dashboard.helius.dev/pay/<id>`) you open in any browser to pay with any wallet
3. After paying in the browser, call `signup` with `mode: "resume"` — finalizes provisioning and configures the API key automatically
4. Or skip the browser: call `signup` with `mode: "autopay"` to pay USDC from the local keypair (wallet must hold ~0.001 SOL + the plan amount in USDC)

> **All paid plans:** `signup` and `upgradePlan` require `email`, `firstName`, and `lastName` for new signups (every plan, including Agent).

Or do the same from the terminal:

```bash
npx clawd-cli@latest keygen                  # Generate keypair
npx clawd-cli@latest signup --plan agent     # Print hosted payment link
# (pay in browser, then:)
npx clawd-cli@latest signup --resume         # Finalize account
# Or autopay USDC from the local keypair:
npx clawd-cli@latest signup --plan agent --pay
```

### 3. Start using tools

Ask questions in plain English — the right tool is selected automatically:

- "What NFTs does this wallet own?"
- "Parse this transaction: 5abc..."
- "Get the balance of Gh9ZwEm..."
- "Create a webhook for \<address\>"

## Public Tool Surface

Clawd MCP exposes 10 public tools total: 9 routed domain tools plus `expandResult`.

- `clawdAccount` — account setup, auth, plans, billing
- `clawdWallet` — wallet balances, holdings, wallet history, identity
- `clawdAsset` — assets, NFTs, collections, token holders
- `clawdTransaction` — transaction parsing and wallet transaction history
- `clawdChain` — chain state, token accounts, blocks, network status, stake reads
- `clawdStreaming` — webhook CRUD and subscription config
- `clawdKnowledge` — docs, guides, pricing, troubleshooting, source, blog, SIMDs
- `clawdWrite` — transfers and staking mutations
- `clawdCompression` — compressed account, balance, proof, and history actions
- `expandResult` — expand summary-first outputs by `resultId`

The 9 routed domain tools share a common shape:

- `action` — the Helius action name to run, such as `getBalance` or `createWebhook`
- domain-specific params — for example `address`, `signatures`, or `webhookURL`
- optional `detail` — `summary`, `standard`, or `full`
- telemetry fields — `_feedback`, `_feedbackTool`, `_model`

Each routed tool takes an `action` field with the Helius action name:

```json
{
  "name": "clawdWallet",
  "arguments": {
    "action": "getBalance",
    "address": "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
    "_feedback": "initial balance check",
    "_feedbackTool": "clawdWallet.getBalance",
    "_model": "your-model-id"
  }
}
```

Heavy responses are summary-first. Routed tools return a compact summary plus `resultId` when the full response would be large or when `detail: "summary"` is requested. Use `expandResult` with that `resultId` to fetch a specific section, range, page, or continuation slice on demand.

## System Prompts

This package ships with pre-built system prompts that teach AI models how to use Helius tools effectively. Find them in `system-prompts/`:

```
system-prompts/
├── helius/              # Core Helius skill
├── clawd-dflow/        # DFlow trading skill
├── clawd-phantom/      # Phantom frontend skill
└── svm/                 # SVM architecture skill
```

Each contains three variants:
- `clawd.developer.md` — for OpenAI Responses/Chat Completions API (`developer` message)
- `clawd.system.md` — for Clawd API (system prompt)
- `full.md` — self-contained with all references inlined (Cursor Rules, ChatGPT, etc.)

See [`clawd-skills/SYSTEM-PROMPTS.md`](https://github.com/Solizardking/core-ai/blob/main/clawd-skills/SYSTEM-PROMPTS.md) for integration guides and code examples.

## Networks

Mainnet Beta (default) and Devnet. Set via `HELIUS_NETWORK` env var or `setNetwork` in the session

## Related Resources

- [Full Documentation](https://www.helius.dev/docs)
- [LLM-Optimized Docs](https://www.helius.dev/docs/llms.txt)
- [API Reference](https://www.helius.dev/docs/api-reference)
- [Billing and Credits](https://www.helius.dev/docs/billing/credits.md)
- [Rate Limits](https://www.helius.dev/docs/billing/rate-limits.md)
- [Dashboard](https://dashboard.helius.dev)
- [Status Page](https://helius.statuspage.io)
- [Full Agent Signup Instructions](https://dashboard.helius.dev/agents.md)
