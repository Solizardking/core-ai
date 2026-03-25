# OKX Market Data — Prices, Charts, PnL Analysis & Address Tracking

## What This Covers

Real-time price queries, OHLC candlestick data, index prices, wallet PnL analysis, and address tracker activities (smart money / KOL trade feeds) on Solana. All commands use the `onchainos` CLI binary.

## Solana Notes

- Chain name: `solana`, chain index: `501`
- For SOL candlestick data, use the **wSOL SPL token address**: `So11111111111111111111111111111111111111112` (note: this is different from the native SOL address used in swaps)
- All amounts are displayed in UI units (e.g., SOL), not lamports

## Price Commands

### Single Token Price

```bash
onchainos market price --address <MINT_ADDRESS> --chain solana
```

Returns: chain ID, token address, timestamp, price in USD. **This is the default for all price / "how much is X" queries.**

### Batch Prices

```bash
onchainos market prices --tokens "501:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v,501:So11111111111111111111111111111111111111112"
```

**Parameters:**
- `--tokens` (required): Comma-separated `chainIndex:address` pairs
- `--chain` (optional): Default chain if addresses lack the `chainIndex:` prefix

Efficient for fetching multiple prices in one call.

### Index Price (Aggregated)

```bash
onchainos market index --address <MINT_ADDRESS> --chain solana
```

Returns an aggregated price from multiple DEX sources — more reliable than a single-DEX price. Use an empty string `""` for the address to get the native token (SOL) price.

**IMPORTANT**: Only use `market index` when the user explicitly asks for "aggregate price", "index price", or cross-exchange composite price. For general price queries, use `market price`.

## OHLC / Candlestick Data

```bash
onchainos market kline \
  --address So11111111111111111111111111111111111111112 \
  --bar 1H \
  --limit 100 \
  --chain solana
```

**Parameters:**
- `--address` (required): Token mint address (use wSOL address for SOL charts)
- `--bar` (optional, default `1H`): Candle size — `1s`, `1m`, `5m`, `15m`, `30m`, `1H`, `4H`, `6H`, `12H`, `1D`, `1W`, `1M`, `3M`
- `--limit` (optional, default 100, max 299): Number of data points
- `--chain` (optional, default `ethereum`)

**Returns array per candle:** `ts` (timestamp), `o` (open), `h` (high), `l` (low), `c` (close), `vol` (volume in token units), `volUsd` (volume in USD), `confirm` (`"0"` = incomplete current candle, `"1"` = complete).

**Kline field mapping**: Always translate short API names to human-readable labels when presenting to users. Never show raw field names like `o`, `h`, `l`, `c` to users.

## Portfolio PnL Commands

### Check Supported Chains

```bash
onchainos market portfolio-supported-chains
```

Verify Solana is in the supported list before calling PnL endpoints.

### Portfolio Overview

```bash
onchainos market portfolio-overview --address <WALLET_ADDRESS> --chain solana --time-frame 3
```

**Parameters:**
- `--address` (required): Wallet address
- `--chain` (required): Single chain name or ID
- `--time-frame` (optional): `1` = 1D, `2` = 3D, `3` = 7D (default), `4` = 30D, `5` = 90D

**Returns:**
- `realizedPnlUsd`, `unrealizedPnlUsd`, `totalPnlUsd`, `totalPnlPercent`
- `winRate`: Percentage of profitable trades
- `buyTxCount`, `sellTxCount`, `buyTxVolume`, `sellTxVolume`
- `avgBuyValueUsd`
- `preferredMarketCap`: User's typical market cap range (bucket 1-5)
- `top3PnlTokenSumUsd`, `top3PnlTokenPercent`: Combined PnL of top 3 tokens
- `topPnlTokenList[]`: Top 3 tokens by PnL with amounts and percentages
- `buysByMarketCap[]`: Distribution of buys across market cap buckets
- Token counts grouped by PnL range (>500%, 0-500%, -50%-0%, <-50%)

### DEX Transaction History

```bash
onchainos market portfolio-dex-history \
  --address <WALLET_ADDRESS> \
  --chain solana \
  --begin 1700000000000 \
  --end 1710000000000
```

**Parameters:**
- `--address` (required): Wallet address
- `--chain` (required): Single chain
- `--begin` (required): Start timestamp in Unix milliseconds
- `--end` (required): End timestamp in Unix milliseconds
- `--limit` (optional, default 20, max 100)
- `--cursor` (optional): For pagination
- `--token` (optional): Filter by token contract address
- `--tx-type` (optional): `1`=BUY, `2`=SELL, `3`=Transfer In, `4`=Transfer Out, `0`=All

**Note**: `--begin` and `--end` are mandatory. For "last 30 days", compute: `end = now * 1000`, `begin = (now - 2592000) * 1000`.

**Returns per transaction:** type, chain, token address/symbol, USD value, amount, price, market cap at time of tx, PnL (USD), timestamp.

### Recent PnL by Token

```bash
onchainos market portfolio-recent-pnl \
  --address <WALLET_ADDRESS> \
  --chain solana \
  --limit 20
```

Returns paginated PnL per token: unrealized PnL (or `"SELL_ALL"` if fully sold), realized PnL, total PnL, token balance, position percentage, holding/selloff timestamps, buy/sell counts, average buy/sell prices.

### Per-Token PnL

```bash
onchainos market portfolio-token-pnl \
  --address <WALLET_ADDRESS> \
  --chain solana \
  --token <MINT_ADDRESS>
```

Returns PnL snapshot for one token: total PnL, unrealized PnL, realized PnL (all with percentages), `isPnlSupported` boolean.

## Address Tracker Activities

```bash
onchainos market address-tracker-activities --tracker-type smart_money --chain solana
```

Fetches the latest DEX transactions by smart money, KOL, or custom tracked addresses.

**Parameters:**
- `--tracker-type` (required): `smart_money`, `kol`, or `multi_address`
- `--chain` (required): Chain name or index
- `--wallet-address` (optional, for `multi_address`): Comma-separated wallet addresses to track

**Use cases:**
- "What are smart money wallets buying?" → `--tracker-type smart_money`
- "What are KOL wallets trading?" → `--tracker-type kol`
- "Track trades for specific wallets" → `--tracker-type multi_address --wallet-address <addrs>`

**Note**: For **aggregated** signal alerts (multiple wallets converging on same token), use `onchainos signal list` from `okx-signals-trenches`. Address tracker gives raw per-transaction feeds.

## Skill Boundary

| Need | Use `okx-dex-market` | Use other reference |
|------|---------------------|-------------------|
| Real-time price (single value) | `market price` | — |
| Price + market cap + liquidity + 24h change | — | `okx-token-discovery` → `token price-info` |
| K-line / candlestick chart | `market kline` | — |
| Index price (multi-source aggregate) | `market index` | — |
| Token search / metadata / rankings / holders | — | `okx-token-discovery` |
| Holder cluster analysis | — | `okx-token-discovery` → cluster commands |
| Smart money / whale aggregated signal alerts | — | `okx-signals-trenches` → `signal list` |
| Raw DEX feeds for smart money / KOL addresses | `address-tracker-activities` | — |
| Wallet PnL overview | `portfolio-overview` | — |
| Wallet DEX transaction history | `portfolio-dex-history` | — |
| Per-token PnL | `portfolio-token-pnl` | — |
| Meme pump scanning | — | `okx-signals-trenches` |
| Swap execution | — | `okx-swap` |

**Rule of thumb**: `okx-dex-market` = raw price feeds, charts, wallet PnL, and address-level trade tracking.

## Cross-Skill Workflows

### Research Token Before Buying

```
1. okx-token-discovery  token search --query BONK --chains solana     → get address
2. okx-token-discovery  token price-info --address <addr> --chain solana → market context
3. okx-token-discovery  token holders --address <addr> --chain solana    → holder distribution
4. okx-market-data      market kline --address <addr> --chain solana     → K-line chart
   ↓ user decides to buy
5. okx-swap             swap execute --from sol --to <addr> ... --chain solana
```

### Wallet PnL Analysis

```
1. market portfolio-supported-chains                                     → verify Solana supported
2. market portfolio-overview --address <wallet> --chain solana --time-frame 3 → 7D PnL
   ↓ drill into specific token
3. market portfolio-recent-pnl --address <wallet> --chain solana          → PnL by token
4. market portfolio-token-pnl --address <wallet> --chain solana --token <addr> → detailed PnL
```

## Display Rules

- Always show USD alongside token amounts
- Use 2 decimal places for high-value tokens (e.g., SOL: $142.50)
- Use significant digits for low-value tokens (e.g., BONK: $0.00001234)
- Show percentage changes with appropriate indicator (positive/negative)
- Gas fees in USD
- `minReceiveAmount` in both UI units and USD

## Edge Cases

- **Solana SOL price/kline**: Native SOL address (`111...1`) does NOT work for `market price` or `market kline`. Use wSOL (`So11111111111111111111111111111111111111112`) instead. For swap operations, the native address must be used.
- **`portfolio-recent-pnl` returns `SELL_ALL`**: Wallet has sold all holdings of that token
- **`portfolio-token-pnl` with `isPnlSupported = false`**: PnL calculation not supported for this token/chain
- **Region restriction** (error `50125` / `80001`): Display "This service is unavailable in your region"

## Common Mistakes

- Using native SOL address (`111...1`) for candlestick data — use wSOL (`So111...112`) instead
- Forgetting `--chain solana` flag (defaults to ethereum)
- Confusing UI units (SOL) with atomic units (lamports) — market data returns UI units, swap commands use atomic units
- Not paginating `dex-history` results (max 100 per page)
- Omitting required `--begin` / `--end` timestamps on `portfolio-dex-history`
- Using `market index` for general price queries (use `market price` — index is only for explicit aggregate/composite price requests)
- Showing raw kline field names (`o`, `h`, `l`, `c`) instead of human-readable labels
