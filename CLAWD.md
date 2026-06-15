# Core AI — Clawd Instructions

This is the canonical Clawd harness for the Clawd-wrapped Helius Core AI fork.

Use this repository as Clawd-native tooling:

- Run the plugin with `clawd --plugin-dir ./helius-plugin`.
- Configure MCP servers in `.clawd/settings.json`.
- Enable ZK Compression docs with the `zkcompression` MCP server at `https://www.zkcompression.com/mcp`.
- Install Light Protocol skills with `npx skills add Lightprotocol/skills` before compressed PDA, compressed token, or custom ZK application work.
- Use `clawd-code` for code, trade, research, image, and voice workflows. The full TypeScript source for the CLI lives in [`./clawd-code/`](./clawd-code/) and installs with `cd clawd-code && npm install && npm run build && ./install.sh`.
- For Bun-native Clawd / Grok agent work (REPL, audio, LSP, MCP, wallet), use [`./clawd-grok/`](./clawd-grok/) with `bun install && bun run dev`.
- For perps-specialized agents (Phoenix Rise, Vulcan, Imperial, TWAMM, on-chain MM), use [`./clawd-agents/clawd-perps-agent/`](./clawd-agents/clawd-perps-agent/) with `npm install && npm run build`.
- The standalone [`./mcp-server/`](./mcp-server/) hosts the pump-sdk and related MCP tools. The [`./v3/`](./v3/) subfolder holds the next-generation Clawd runtime scaffold.
- [`./knowledge/`](./knowledge/) is the Clawd knowledge base (facts, gotchas, patterns, decisions). [`./docs/adr/`](./docs/adr/) holds the architecture decision records.
- Read canonical skill sources from `helius-skills/` before editing generated `.agents/skills/` or `helius-mcp/system-prompts/` outputs.
- Keep generated prompt variants Clawd-native: `clawd.developer.md`, `clawd.system.md`, and `full.md`.
- Keep all trading/execution work gated by Clawd Code preflight and PAPER defaults unless explicitly armed.
