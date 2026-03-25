# OKX DEX Swap — Multi-Source Aggregated Trading

## What This Covers

OKX DEX swap aggregates liquidity from 500+ sources to find optimal trade routes on Solana. No token approval step is needed.

All commands use the `onchainos` CLI binary. See the Prerequisites section in SKILL.md for installation.

## Solana-Specific Constants

- **Chain name**: `solana` (or chain index `501`)
- **Native SOL address**: `11111111111111111111111111111111` — this is the system program address
- **CRITICAL**: Do NOT use `So11111111111111111111111111111111111111112` (wSOL) for swaps — that is wrapped SOL and causes failures
- **Amount units**: Lamports (1 SOL = 1,000,000,000 lamports, 9 decimals)
- **`exactOut` mode**: NOT supported on Solana — always use `exactIn`
- **Approval step**: Not needed on Solana — skip straight to quote → execute

## Common Token Addresses (Solana)

| Token | Mint Address | Decimals |
|-------|-------------|----------|
| SOL (native) | `11111111111111111111111111111111` | 9 |
| USDC | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | 6 |
| USDT | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` | 6 |
| BONK | `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` | 5 |

## Token Address Resolution

Never guess or hardcode token contract addresses — the same symbol can have different addresses per chain.

**Resolution order:**
1. **CLI TOKEN_MAP** — pass directly as `--from`/`--to`: native tokens (`sol`), stablecoins (`usdc`, `usdt`, `dai`), wrapped (`weth`, `wbtc`)
2. **`onchainos token search --query <symbol> --chains solana`** — for all other symbols
3. **User provides full address directly**

Multiple search results → show name/symbol/address/chain and ask user to confirm. Single exact match → show token details for user to verify before executing.

## Commands

### 1. List Supported Chains

```bash
onchainos swap chains
```

Returns `chainIndex`, `chainName`, and `dexTokenApproveAddress` for each supported chain.

### 2. List Liquidity Sources

```bash
onchainos swap liquidity --chain solana
```

Returns all DEX sources available on Solana (id, name, logo).

### 3. Get a Quote

```bash
onchainos swap quote \
  --from 11111111111111111111111111111111 \
  --to EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --amount 1000000000 \
  --chain solana
```

**Parameters:**
- `--from` (required): Source token mint address (or TOKEN_MAP alias)
- `--to` (required): Destination token mint address (or TOKEN_MAP alias)
- `--amount` (required): Amount in atomic units (lamports for SOL, smallest unit for SPL tokens)
- `--chain` (required): Chain name (`solana`) or index (`501`)
- `--swap-mode` (optional): `exactIn` (default) or `exactOut` — `exactOut` NOT supported on Solana
- **Do NOT pass `--slippage` to `swap quote`** — slippage is only for `swap execute`

**Returns:**
- `toTokenAmount`: Expected output in atomic units
- `fromTokenAmount`: Input amount
- `estimateGasFee`: Estimated gas cost
- `tradeFee`: Trading fee
- `priceImpactPercent`: Price impact as a percentage string
- `router`: Routing type used
- `dexRouterList[]`: Routing path showing DEX names and percentages
- Token metadata for both from/to: `isHoneyPot`, `taxRate`, `decimal`, `tokenUnitPrice`

### 4. Execute a Swap (One-Shot)

```bash
onchainos swap execute \
  --from 11111111111111111111111111111111 \
  --to EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --amount 1000000000 \
  --chain solana \
  --wallet YOUR_WALLET_ADDRESS
```

`swap execute` is a **one-shot command**: quote → swap → sign & broadcast → txHash. The CLI internally blocks honeypots and trades with price impact >10%.

**Parameters:**
- `--from` (required): Source token mint address (or TOKEN_MAP alias)
- `--to` (required): Destination token mint address (or TOKEN_MAP alias)
- `--amount` (required): Amount in atomic units
- `--chain` (required): Chain name or index
- `--wallet` (required): User's wallet address
- `--slippage` (optional): Omit to use autoSlippage. Only pass if user explicitly requests a specific value
- `--gas-level` (optional): `average` (default), `fast` (meme/time-sensitive), `slow` (cost-sensitive)
- `--tips` (optional, Solana only): Jito MEV protection tip in SOL (0.0000000001–2 SOL)

**Returns:**
- `swapTxHash`: Transaction signature
- `fromAmount`, `toAmount`: Actual amounts
- `priceImpact`: Impact percentage
- `gasUsed`: Gas/compute consumed

## Swap Flow

1. **Resolve tokens**: Use TOKEN_MAP aliases or `onchainos token search` if the user provides names instead of addresses
2. **Get a quote**: `onchainos swap quote` — review price impact and routing
3. **Safety checks**: Verify honeypot status, tax rates, price impact (see Risk Controls below)
4. **Present to user**: Show input/output amounts in human-readable units, price impact, and routing
5. **Get user confirmation**: ALWAYS require explicit confirmation before executing
6. **Execute swap**: `onchainos swap execute` — handles signing & broadcasting internally
7. **Report result**: Show txHash with explorer link, suggest follow-ups

**Alternative broadcast path**: For maximum Solana block inclusion, you can use `swap quote` to get transaction data, then sign locally and broadcast via **Helius Sender** (which dual-routes to validators AND Jito). See `references/helius-sender.md`.

## Trading Parameter Presets

| Preset | Scenario | Slippage | Gas |
|--------|----------|----------|-----|
| Meme/Low-cap | Meme coins, new tokens, low liquidity | autoSlippage (ref 5%-20%) | `fast` |
| Mainstream | SOL/major tokens, high liquidity | autoSlippage (ref 0.5%-1%) | `average` |
| Stablecoin | USDC/USDT/DAI pairs | autoSlippage (ref 0.1%-0.3%) | `average` |
| Large Trade | priceImpact >= 10% AND value >= $1,000 | autoSlippage | `average` |

## Risk Controls

These checks are MANDATORY before every swap execution:

| Risk Item | Buy | Sell | Notes |
|-----------|-----|------|-------|
| Honeypot (`isHoneyPot=true`) | BLOCK | WARN (allow exit) | Selling allowed for stop-loss |
| High tax rate (>10%) | WARN | WARN | Display exact tax rate |
| No quote available | CANNOT | CANNOT | Token may be unlisted or zero liquidity |
| Black/flagged address | BLOCK | BLOCK | Address flagged by security services |
| New token (<24h) | WARN | PROCEED | Extra caution on buy side |
| Insufficient liquidity | CANNOT | CANNOT | Liquidity too low to execute |

**Legend**: BLOCK = halt, require explicit override · WARN = display warning, ask confirmation · CANNOT = operation impossible · PROCEED = allow with info

### Price Impact Gates
- **> 5%**: Warn the user, ask for confirmation before proceeding
- **> 10%**: Strongly warn, suggest reducing amount or splitting the trade, proceed only with explicit confirmation

### Slippage
- Omit `--slippage` to use autoSlippage (recommended)
- For volatile or low-liquidity tokens, user may request specific slippage (3-5%)
- **> 5% slippage**: Warn and suggest splitting the trade

## MEV Protection (Solana)

Two conditions (OR — either triggers enable):
- Potential Loss = `toTokenAmount × toTokenPrice × slippage` >= **$50**
- Transaction Amount = `fromTokenAmount × fromTokenPrice` >= **$1,000**

Disable only when BOTH are below threshold. If price unavailable → enable by default.

**How to enable on Solana:**
```bash
onchainos swap execute --tips <sol_amount> ...
```

Tips range: 0.0000000001–2 SOL. The CLI auto-applies Jito calldata. Note: `--tips` and `computeUnitPrice` are mutually exclusive — the CLI sets `computeUnitPrice=0` automatically when tips are used.

## Quote Freshness

In interactive mode, if >10 seconds elapse between quote and execution, re-fetch the quote. Compare the price difference against the slippage value:
- Price diff < slippage → proceed silently
- Price diff >= slippage → warn user and ask for re-confirmation

## Amount Conversion

All CLI parameters use atomic units. Convert for display:

```
Human-readable = atomic_amount / (10 ^ decimals)
Atomic = human_readable * (10 ^ decimals)
```

Examples:
- 1 SOL = 1,000,000,000 lamports (9 decimals)
- 1 USDC = 1,000,000 (6 decimals)
- 1 BONK = 100,000 (5 decimals)

Always display human-readable amounts to the user with USD equivalents where available.

## Error Handling

| Error | Action |
|-------|--------|
| `50125` / `80001` | Region restricted — display: "This service is unavailable in your region" |
| Rate limit | Suggest creating an OKX API key at the Developer Portal |
| `swap execute` failure | May be transient — retry **once**. If retry fails, surface error to user. Do NOT loop. |

## Common Mistakes

- Using wSOL address (`So111...`) instead of native SOL (`111...1`) for swaps
- Using `exactOut` mode on Solana (not supported)
- Forgetting to convert amounts to atomic units (lamports)
- Not checking `isHoneyPot` and `priceImpactPercent` before confirming
- Auto-executing swaps without user confirmation
- Passing `--slippage` to `swap quote` (only valid on `swap execute`)
- Hardcoding token addresses instead of using TOKEN_MAP or `token search`
