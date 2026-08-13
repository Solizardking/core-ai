# Core AI — Clawd Agent Instructions

> This file is the Layer A harness for Clawd Code and other Clawd-compatible agents.
> Skills in `.agents/skills/` provide the domain expertise (Layer B).

## Repository Overview

This monorepo contains Clawd Core — Solana agent tooling that talks to Helius RPC/DAS/Sender:

| Package | What it does |
|---|---|
| `clawd-core/` | Identity / umbrella for the Clawd Core stack |
| `clawd-mcp/` | MCP server (`npx clawd-mcp@latest`) — exposes 10 public tools total |
| `solana-mcp/` | Official Solana documentation MCP server — RAG search + canonical docs retrieval |
| `clawd-skills/` | Canonical skill source — `SKILL.md` + reference files for each domain |
| `clawd-plugin/` | Clawd Code plugin — bundles skills + auto-starts MCP server |
| `clawd-cli/` | CLI for account setup, blockchain queries, and staking |
| `clawd-cursor/` | Cursor-compatible skill/rule package |
| `clawd-code/` | Full Solana-native AI CLI — xAI/Anthropic/DeepSeek/OpenRouter, voice, web, arena |
| `clawd-grok/` | Bun-native REPL + audio + LSP + MCP + wallet runtime |
| `membrain/` | Core AI selective memory — `membraned` gRPC daemon, SQLite/pgvector, TS/Python/OpenClawd clients |
| `clawd-perps-agent/` | Perps agents: Phoenix Rise, Vulcan, Imperial, TWAMM, on-chain MM, Telegram |
| `ai-training/` | LoRA fine-tuning platform, HF Jobs, W&B, wiki ingest, Solana benchmark |

## Clawd Code Setup

Use the plugin directly:

```bash
clawd --plugin-dir ./clawd-plugin
```

Or configure Clawd MCP in `.clawd/settings.json`:

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

For ZK Compression docs and Light Protocol examples, add the docs MCP server and install the Light Protocol skill pack:

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

```bash
npx skills add Lightprotocol/skills
```

## Skills

Skills are in `.agents/skills/`. Each provides expert routing, rules, and reference docs:

| Skill | Directory | When to use |
|---|---|---|
| **Clawd Core** | `.agents/skills/clawd/` | Building Solana apps with Helius RPC, DAS, Sender, and streaming |
| **Clawd DFlow** | `.agents/skills/clawd-dflow/` | Trading apps combining DFlow with Clawd Core |
| **Clawd Jupiter** | `.agents/skills/clawd-jupiter/` | DeFi apps combining Jupiter with Clawd Core |
| **Clawd Phantom** | `.agents/skills/clawd-phantom/` | Frontend Solana apps with Phantom wallet + Clawd Core |
| **Clawd OKX** | `.agents/skills/clawd-okx/` | Trading/intelligence apps with OKX and Clawd Core |
| **SVM** | `.agents/skills/svm/` | Solana protocol internals |

For compressed PDAs, compressed tokens, nullifiers, validity proofs, or custom ZK apps, also load the Light Protocol skills installed via `npx skills add Lightprotocol/skills`.

Read the relevant `SKILL.md` before implementing. It tells you which reference files to read and which MCP tools to use.

## Clawd Code Modes

`clawd-code` supports multiple modes selectable via `--mode` or at the REPL:

| Mode | Command | Description |
|---|---|---|
| `code` | `clawd-code code "<prompt>"` | AI coding assistant (default) |
| `trade` | `clawd-code trade "<prompt>"` | Paper-gated Phoenix/Vulcan perps |
| `research` | `clawd-code research "<prompt>"` | Web search + synthesis |
| `image` | `clawd-code image "<prompt>"` | Image generation |
| `voice` | `clawd-code voice --persona eve` | Real-time voice — eve/ara/rex/sal |
| `web` | `clawd-code web` | Local Next.js UI on port 3000 |
| `arena` | `clawd-code arena "<prompt>"` | Multi-provider side-by-side benchmark |

## Multi-Provider LLM Routing

Set the appropriate API key env var and pass `--model`:

- `XAI_API_KEY` → `grok-4.6`, `grok-4.20-multi-agent`
- `ANTHROPIC_API_KEY` → `claude-opus-4-8`, `claude-sonnet-4-6`
- `DEEPSEEK_API_KEY` → `deepseek-r1`, `deepseek-v3`
- `OPENROUTER_API_KEY` → any OpenRouter model ID

## Coding Conventions

- TypeScript: `import { createHelius } from "helius-sdk"` then `const helius = createHelius({ apiKey })`
- Rust: `use helius::Helius` then `Helius::new("apiKey", Cluster::MainnetBeta)?`
- For `@solana/kit` integration, use `helius.raw` for the underlying `Rpc` client.
- For Clawd Code workflows, use `clawd-code <mode> "<prompt>"`.

## Documentation Maintenance

- Always update `README.md` in the same change when adding or changing packages, MCP servers/tools, root scripts, setup steps, ports, transports, MCP client configuration, environment variables, generated files, or verification workflows.
- Keep package-specific implementation details in the package README, but keep the root README complete enough for a fresh checkout.

## Environment Variables

- Never commit API keys to git.
- Use `HELIUS_API_KEY` for Clawd CLI / Clawd MCP (Helius cloud credential).
- Use `~/.clawd-code/.env` with `XAI_API_KEY`, `HELIUS_API_KEY`, and `SOLANA_RPC_URL` for Clawd Code.
- Use `WANDB_API_KEY` for W&B training tracking (ai-training/ only).
- Use `HONCHO_API_KEY` for persistent cross-session agent memory (ai-training/memory/honcho.py).
- Use `membrain/` (`membraned` on `:9090`) for Core AI runtime memory. Optional `MEMBRANE_API_KEY` / `MEMBRANE_ENCRYPTION_KEY`. Connect agents with `MEMBRAIN_GRPC_ENDPOINT`.

## MCP Tool Usage Rules

- Use MCP tools for live blockchain data; do not hardcode or mock chain state.
- Prefer specific routed actions, such as `clawdWallet` + `getBalance`, over broad expensive calls.
- Use batch endpoints when available.
- Use `clawdTransaction` + `parseTransactions` for human-readable transaction data.
- Use `clawdKnowledge` + `troubleshootError` before manual diagnosis.
- Use `clawdKnowledge` + `getRateLimitInfo` or `getHeliusCreditsInfo`; do not guess credit costs.
- For pricing questions, start with `clawdAccount` + `getHeliusPlanInfo`.

## Transaction Sending

- Use Helius Sender endpoints for low-latency sends.
- Include `skipPreflight: true` and `maxRetries: 0` when using Sender.
- Include a Jito tip and priority fee.
- Use `clawdChain` + `getPriorityFeeEstimate`; do not hardcode fees.

## AI Training Platform

When working in `ai-training/`:

- Launch training jobs with `bash scripts/launch_hf_jobs.sh a100-large`.
- Ingest wiki SFT data with `python3 scripts/ingest_wiki_data.py --push`.
- Run the Solana benchmark with `python3 scripts/solana_benchmark.py --model ordlibrary/DeepSolanaZKr-1`.
- Check W&B eval status with `python3 scripts/wandb_eval.py`.
- Use `memory/honcho.py` `AgentMemory` for persistent cross-session recall; set `HONCHO_API_KEY` for cloud storage.
- All HF Job storage must route to `/data` bucket — `HF_HOME=/data/hf_cache`, `output_dir: /data/outputs/`.
- Base model is `Qwen/Qwen2.5-1.5B-Instruct`; do not switch to multi-shard models without checking shard count first.

## Generated Content

The following directories are generated by `npx tsx scripts/compile-skills.ts` from canonical sources in `clawd-skills/`:

- `.agents/skills/`
- `clawd-mcp/system-prompts/`

Modify canonical source in `clawd-skills/` and re-run the compiler.
