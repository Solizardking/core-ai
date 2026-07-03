# Clawd Core AI

The Clawd-wrapped Helius AI tooling repository — live Solana infrastructure, Helius skills, MCP tooling, and Clawd Code integration for lobster-native agents.

[![Buy $CLAWD](https://img.shields.io/badge/Buy_%24CLAWD-Phantom-blueviolet?style=flat-square)](https://phantom.com/tokens/solana/8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump)
[![Dexscreener](https://img.shields.io/badge/Chart-Dexscreener-green?style=flat-square)](https://dexscreener.com/solana/8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump)
[![Birdeye](https://img.shields.io/badge/Chart-Birdeye-orange?style=flat-square)](https://birdeye.so/token/8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump)
[![Jupiter](https://img.shields.io/badge/Swap-Jupiter-blue?style=flat-square)](https://jup.ag/swap/SOL-8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump)
[![Model](https://img.shields.io/badge/Model-DeepSolanaZKr--1-yellow?style=flat-square)](https://huggingface.co/ordlibrary/DeepSolanaZKr-1)
[![Dataset](https://img.shields.io/badge/Dataset-solana--clawd--instruct-blue?style=flat-square)](https://huggingface.co/datasets/solanaclawd/solana-clawd-instruct)

```text
Token:  $CLAWD · 8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
Model:  ordlibrary/DeepSolanaZKr-1 · solanaclawd/solana-clawd-1.5b-lora
```

## Clawd Fork Note

This fork keeps the Helius Solana infrastructure surface and replaces the old assistant/plugin identity with Clawd and Clawd Code. The intent is direct: show that the Helius agent tooling can run as a Clawd-native lobster stack while preserving the useful MCP, CLI, and skill machinery.

## Packages

| Package | Description | Install |
|---|---|---|
| [`helius-cli`](./helius-cli) | CLI for managing Helius accounts and querying Solana data | `npm install -g helius-cli` |
| [`helius-mcp`](./helius-mcp) | MCP server with 10 public tools total: 9 routed domains plus `expandResult` | `npx helius-mcp@latest` in `.clawd/settings.json` |
| [`helius-skills`](./helius-skills) | Standalone Clawd Code skills for building on Solana | `./install.sh` |
| [`helius-plugin`](./helius-plugin) | Clawd Code plugin — bundles all skills and auto-starts the MCP server | `clawd --plugin-dir ./helius-plugin` |
| [`clawd-code`](./clawd-code) | Curl-installable Solana-native AI coding CLI (xAI / Anthropic / DeepSeek / OpenRouter) with paper-gated perps workflows | `curl -fsSL https://raw.githubusercontent.com/Solizardking/solana-clawd/main/clawd-code/install.sh \| sh` |
| [`clawd-grok`](./clawd-grok) | Bun-native Clawd / Grok agent runtime — REPL, headless, audio, LSP, MCP, payments, wallet, verify | `bun install && bun run dev` |
| [`clawd-perps-agent`](./clawd-perps-agent) | Specialized perps agent: Phoenix Rise, Vulcan, Imperial WS, on-chain MM, TWAMM, Telegram | `cd clawd-perps-agent && npm install && npm run build` |
| [`mcp-server`](./mcp-server) | Standalone MCP server for pump-sdk and related tooling | `npm install && npm run build` |
| [`solana-mcp`](./solana-mcp) | Official Solana documentation MCP server with RAG search, section listing, and canonical documentation retrieval | `pnpm install && pnpm build` |
| [`v3`](./v3) | v3 Clawd runtime — next-generation Clawd scaffolding | `npm install && npm run build` |
| [`knowledge`](./knowledge) | Clawd knowledge base — facts, gotchas, patterns, anti-patterns, decisions, API behaviors | read-only reference |
| [`docs`](./docs) | Architecture decision records (ADRs) for the open-clawd stack | read-only reference |

## Quick Start

Install dependencies per package instead of running one repo-wide install. The package managers differ by package.

```bash
git clone <repo-url>
cd core-ai
```

Common setup paths:

```bash
cd helius-mcp && pnpm install && pnpm build
cd ../helius-cli && pnpm install && pnpm build
cd ../mcp-server && npm install && npm run build
cd ../solana-mcp && pnpm install && pnpm build
```

## Clawd Code Integration

Use this repository with Clawd Code:

```bash
clawd --plugin-dir ./helius-plugin
```

## MCP Servers

This repo ships three local MCP surfaces plus optional external documentation MCPs:

| Server | Path / package | Purpose | Transport | Main command |
|---|---|---|---|---|
| Helius MCP | [`helius-mcp`](./helius-mcp) / `helius-mcp@latest` | Routed Helius account, wallet, asset, transaction, chain, streaming, write, compression, and knowledge tools | stdio | `npx helius-mcp@latest` |
| Pump MCP | [`mcp-server`](./mcp-server) / `@pump-fun/mcp-server` | Pump SDK transaction builders, quotes, analytics, AMM, fee, incentive, metadata, and wallet utilities | stdio or HTTP | `npm run mcp:pump:start` |
| Solana Docs MCP | [`solana-mcp`](./solana-mcp) / `solana-mcp` | Official Solana documentation search, source listing, and canonical docs retrieval | HTTP | `npm run mcp:solana:dev` |
| ZK Compression MCP | external | ZK Compression and Light Protocol documentation | HTTP | `https://www.zkcompression.com/mcp` |

Root helper scripts:

```bash
npm run mcp:pump:build
npm run mcp:pump:start
npm run mcp:pump:start:http
npm run mcp:solana:build
npm run mcp:solana:dev
npm run mcp:solana:start
```

For MCP-only setup, add Helius to `.clawd/settings.json`:

```json
{
  "mcpServers": {
    "helius": {
      "command": "npx",
      "args": ["helius-mcp@latest"]
    }
  }
}
```

For the Pump SDK MCP server, build first and then configure stdio or HTTP:

```bash
cd mcp-server
npm install
npm run build
npm run start:http
```

```json
{
  "mcpServers": {
    "solana-clawd-pump": {
      "command": "node",
      "args": ["/Users/8bit/Downloads/open-clawd-code-main/core-ai/mcp-server/dist/index.js"],
      "env": {
        "SOLANA_RPC_URL": "https://api.mainnet-beta.solana.com"
      }
    }
  }
}
```

To run the local Solana documentation MCP server from this repo:

```bash
cd solana-mcp
pnpm install
pnpm dev:local
```

Then point an MCP client at `http://localhost:8080/mcp`:

```json
{
  "mcpServers": {
    "solana-docs": {
      "type": "http",
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

`solana-mcp` defaults to port `8080`. For local development, copy `solana-mcp/.env.example` to `solana-mcp/.env` and set Databricks credentials when using live RAG-backed search. `list_sections` and generated source catalog tests are available without committing any secrets.

For ZK Compression and Light Protocol work, also install the Light Protocol skills and enable the documentation MCP:

```bash
npx skills add Lightprotocol/skills
```

```json
{
  "mcpServers": {
    "zkcompression": {
      "type": "http",
      "url": "https://www.zkcompression.com/mcp"
    }
  }
}
```

## helius-cli

A CLI built for developers and Clawd agents to manage Helius accounts, query Solana blockchain data, and automate workflows.

```bash
npm install -g helius-cli
helius config set-api-key <your-api-key>
helius balance <wallet-address>
helius tx parse <signature>
```

## helius-mcp

A Model Context Protocol server that exposes Helius and Solana tools directly to Clawd Code and other MCP-compatible clients.

The server exposes 10 public tools total:

- `heliusAccount`
- `heliusWallet`
- `heliusAsset`
- `heliusTransaction`
- `heliusChain`
- `heliusStreaming`
- `heliusKnowledge`
- `heliusWrite`
- `heliusCompression`
- `expandResult`

The routed domain tools take a Helius action name in `action`, for example `heliusWallet` + `getBalance` or `heliusStreaming` + `createWebhook`. Heavy responses are summary-first; use `expandResult` to fetch a full section, range, page, or continuation on demand.

## Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `HELIUS_API_KEY` | `helius-cli`, `helius-mcp`, Helius skills | Authenticated Helius API access |
| `SOLANA_RPC_URL` | `mcp-server`, Clawd Code | Single Solana RPC endpoint |
| `SOLANA_RPC_URLS` | `mcp-server` | Comma-separated RPC failover endpoints |
| `XAI_API_KEY` | `clawd-code`, `clawd-grok` | xAI model access |
| `ANTHROPIC_API_KEY` | `clawd-code` | Anthropic model access |
| `DEEPSEEK_API_KEY` | `clawd-code` | DeepSeek model access |
| `OPENROUTER_API_KEY` | `clawd-code` | OpenRouter model access |
| `WANDB_API_KEY` | `ai-training` | W&B training and eval tracking |
| `HONCHO_API_KEY` | `ai-training` | Persistent cross-session agent memory |
| `DATABRICKS_HOST` | `solana-mcp` | Databricks workspace for official Solana docs retrieval |
| `DATABRICKS_TOKEN` | `solana-mcp` | Local Databricks auth token; Databricks Apps can inject client credentials instead |
| `DATABRICKS_VS_INDEX` | `solana-mcp` | Vector Search index for Solana docs chunks |
| `DATABRICKS_WAREHOUSE_ID` | `solana-mcp` | SQL warehouse for docs fallback and analytics |
| `DATABRICKS_ANALYTICS_SCHEMA` | `solana-mcp` | Schema for Solana MCP analytics events |
| `REDIS_URL` | `solana-mcp` | Optional SSE/session backing |

## helius-skills

Standalone Clawd Code skills turn Clawd into a Solana domain expert. Each skill is a self-contained directory with a `SKILL.md` and reference files.

| Skill | Invoke | Description |
|---|---|---|
| [`helius`](./helius-skills/helius) | `/clawd:build` or the Helius skill | Build Solana apps with Helius infrastructure |
| [`helius-dflow`](./helius-skills/helius-dflow) | `/clawd:dflow` | Build Solana trading apps with DFlow and Helius |
| [`helius-jupiter`](./helius-skills/helius-jupiter) | `/clawd:jupiter` | Build DeFi apps with Jupiter and Helius |
| [`helius-phantom`](./helius-skills/helius-phantom) | `/clawd:phantom` | Build frontend Solana apps with Phantom and Helius |
| [`helius-okx`](./helius-skills/helius-okx) | `/clawd:okx` | Compose OKX DEX/intelligence tooling with Helius |
| [`svm`](./helius-skills/svm) | `/clawd:svm` | Explore Solana architecture and protocol internals |

For compressed PDA, compressed token, and custom ZK app development, install the upstream Light Protocol skills:

```bash
npx skills add Lightprotocol/skills
```

By default, skill installers now target `~/.clawd/skills/`. Use `--project` to install to `.clawd/skills/` in your current project.

## helius-plugin

An all-in-one Clawd Code plugin that bundles skills and auto-starts MCP servers.

```bash
clawd --plugin-dir ./helius-plugin
```

Included skills:

| Skill | Invoke | Description |
|---|---|---|
| Build | `/clawd:build` | Expert Solana developer — Helius APIs, routing logic, SDK patterns |
| DFlow | `/clawd:dflow` | Trading apps — DFlow swaps, prediction markets, KYC, Helius Sender |
| Jupiter | `/clawd:jupiter` | DeFi apps — swaps, lending, limit orders, DCA, transaction submission |
| Phantom | `/clawd:phantom` | Frontend Solana apps — Phantom wallet integration and secure proxying |
| OKX | `/clawd:okx` | DEX aggregation and intelligence integrations |
| SVM | `/clawd:svm` | Solana protocol architecture and internals |

## Generated Content

The following directories are generated by `npx tsx scripts/compile-skills.ts` from canonical sources in `helius-skills/`:

- `.agents/skills/` — Clawd-native skills + prompt variants
- `helius-mcp/system-prompts/` — npm-shipped prompt copies

Modify canonical sources in `helius-skills/` and re-run the compiler.

## Development

```bash
cd helius-cli   # or helius-mcp
pnpm install
pnpm build
pnpm test
```

For MCP package work:

```bash
cd mcp-server
npm install
npm run build
npm test

cd ../solana-mcp
pnpm install
pnpm build
pnpm test
pnpm audit:security
```

Requirements vary by package:

| Package | Runtime | Package manager | Notes |
|---|---|---|---|
| `helius-cli`, `helius-mcp` | Node.js 20+ | pnpm | Set a Helius API key from https://dashboard.helius.dev for authenticated Helius calls |
| `mcp-server` | Node.js 18+ | npm | Uses `SOLANA_RPC_URL` or `SOLANA_RPC_URLS`; transaction tools build instructions and do not submit them |
| `solana-mcp` | Node.js 24.x | pnpm 10.30.0 | Uses Databricks env vars for live retrieval; `REDIS_URL` enables SSE/session backing |

## Documentation Maintenance

Update this README in the same change whenever you add or change:

- a package, MCP server, CLI mode, or root script
- setup steps, ports, transports, or MCP client configuration
- required environment variables or secrets handling
- generated files or canonical source locations
- build, test, deploy, or audit commands

Keep package-specific details in each package README, but keep this root README complete enough for a new agent or developer to find the right package and run the right verification commands from a fresh checkout.

## Resources

- [Clawd Code](../clawd-code)
- [Helius](https://www.helius.dev/)
- [Helius Docs](https://www.helius.dev/docs)
- [helius-sdk](https://open-clawd.local/helius-labs/helius-sdk)
- [Model Context Protocol](https://modelcontextprotocol.io)
