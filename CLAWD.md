# Core AI — Clawd Instructions

This is the canonical Clawd harness for the Clawd-wrapped Helius Core AI fork.

Use this repository as Clawd-native tooling:

- Run the plugin with `clawd --plugin-dir ./helius-plugin`.
- Configure MCP servers in `.clawd/settings.json`.
- Enable ZK Compression docs with the `zkcompression` MCP server at `https://www.zkcompression.com/mcp`.
- Install Light Protocol skills with `npx skills add Lightprotocol/skills` before compressed PDA, compressed token, or custom ZK application work.
- Use `clawd-code` for code, trade, research, image, and voice workflows.
- Read canonical skill sources from `helius-skills/` before editing generated `.agents/skills/` or `helius-mcp/system-prompts/` outputs.
- Keep generated prompt variants Clawd-native: `clawd.developer.md`, `clawd.system.md`, and `full.md`.
- Keep all trading/execution work gated by Clawd Code preflight and PAPER defaults unless explicitly armed.
