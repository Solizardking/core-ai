# Clawd Core Skills

Standalone [Clawd Code skills](https://docs.clawd.com/en/docs/clawd-code/skills) for building on Solana. Each skill is a self-contained directory — install it once and invoke it by name in any Clawd Code session.

## Skills

| Skill | Invoke | Description |
|---|---|---|
| [`clawd`](./clawd) | `/clawd` | Build Solana apps with Clawd Core — Sender, DAS API, WebSockets, Laserstream, webhooks, priority fees, and Wallet API |
| [`clawd-dflow`](./clawd-dflow) | `/clawd-dflow` | Build Solana trading apps with DFlow (spot swaps, prediction markets, Proof KYC) + Clawd Core |
| [`svm`](./svm) | `/svm` | Explore Solana's architecture and protocol internals — SVM, account model, consensus, validators, and token extensions |
| [`clawd-phantom`](./clawd-phantom) | `/clawd-phantom` | Build browser-based Solana apps with Phantom wallet + Clawd Core |

## Installation

Each skill has its own `install.sh`:

```bash
./clawd/install.sh          # personal install (~/.clawd/skills/)
./clawd/install.sh --project # project install (.clawd/skills/)
```

All skills require the Clawd MCP server except `svm` (which uses public sources only):

```bash
npx clawd-mcp@latest  # configure in .clawd/settings.json or your MCP client
```

Full installation instructions are in the [root README](../README.md#clawd-skills).
