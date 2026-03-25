# OKX Gateway & Portfolio — Transaction Infrastructure & Wallet Balances

## What This Covers

Two capabilities:
1. **Gateway**: Transaction infrastructure — gas/priority fee estimation, transaction simulation, broadcasting pre-signed transactions, and order tracking
2. **Portfolio**: Multi-chain wallet balance queries with risk filtering

All commands use the `onchainos` CLI binary.

**Important**: For most Solana transactions, prefer **Helius Sender** over OKX Gateway for broadcasting. Sender dual-routes to validators AND Jito for maximum block inclusion probability. Use OKX Gateway when you need transaction simulation or when working with cross-chain workflows.

---

## Gateway Commands

### List Supported Chains

```bash
onchainos gateway chains
```

Returns 20+ supported chains with their details.

### Gas / Priority Fee Estimation

```bash
onchainos gateway gas --chain solana
```

**Solana-specific return fields:**
- `proposePriorityFee`: Standard priority fee
- `safePriorityFee`: Safe priority fee
- `fastPriorityFee`: Fast priority fee
- `extremePriorityFee`: Extreme priority fee

Note: For Solana priority fees, prefer Helius `getPriorityFeeEstimate` MCP tool — it provides program-specific estimates based on recent slot data. See `references/helius-priority-fees.md`.

### Gas Limit Estimation

```bash
onchainos gateway gas-limit \
  --from <SENDER_ADDRESS> \
  --to <RECIPIENT_ADDRESS> \
  --chain solana
```

**Optional parameters:**
- `--amount` (optional): Transaction amount
- `--data` (optional): Transaction data (hex-encoded)

Estimates gas/compute units for a transaction.

### Transaction Simulation

```bash
onchainos gateway simulate \
  --from <SENDER_ADDRESS> \
  --to <PROGRAM_ADDRESS> \
  --data <HEX_DATA> \
  --chain solana
```

**Returns:**
- `intention`: Human-readable description of what the transaction does
- `assetChange[]`: List of token/SOL balance changes per address
- `gasUsed`: Actual compute units consumed
- `failReason`: If simulation fails, the reason why
- `risks[]`: Identified risks or warnings

**Use cases:**
- Preview what a transaction will do before signing
- Verify expected token transfers and amounts
- Detect potential failures before broadcasting
- Check for risks (e.g., drainer contracts, unexpected transfers)

### Broadcast Transaction

```bash
onchainos gateway broadcast \
  --signed-tx <BASE58_SIGNED_TX> \
  --address <SENDER_ADDRESS> \
  --chain solana
```

**Solana-specific:** Signed transactions MUST be **base58** encoded (not hex like EVM chains).

**Returns:**
- `orderId`: Tracking ID for the order
- `txHash`: Transaction signature

**Important**: The gateway does NOT sign transactions — it only broadcasts pre-signed ones. The user must sign locally.

**For most Solana use cases, prefer Helius Sender** (`references/helius-sender.md`). Use OKX Gateway when:
- You need the `simulate` step first
- You're building cross-chain workflows
- You need the `orderId` tracking system

### Track Order Status

```bash
onchainos gateway orders --address <SENDER_ADDRESS> --chain solana
```

**Optional parameters:**
- `--order-id` (optional): Filter by specific order ID

**Returns:**
- `cursor`: Pagination cursor for subsequent requests
- **Per order:** `txStatus` (`1` = Pending, `2` = Success, `3` = Failed), `orderId`, `txHash`, `failReason` (if failed), timestamp, and other metadata

## MEV Protection (Gateway Layer)

On Solana, use Jito tips (`--tips` param). **Mutually exclusive with `computeUnitPrice`** — do NOT set both.

The `swap execute` command handles MEV protection automatically via `--tips`. The gateway layer is only relevant when broadcasting raw pre-signed transactions.

---

## Portfolio Commands

### List Supported Chains

```bash
onchainos portfolio chains
```

Returns all supported chains for balance queries. Different from PnL-supported chains.

### Total Portfolio Value

```bash
onchainos portfolio total-value \
  --address <WALLET_ADDRESS> \
  --chains solana \
  --asset-type 0
```

**Parameters:**
- `--address` (required): Wallet address
- `--chains` (required): Comma-separated chain names or IDs (max 50)
- `--asset-type` (optional, default `"0"`): `0` = all assets, `1` = tokens only, `2` = DeFi positions only
- `--exclude-risk` (optional, default `true`): Filter risky/scam tokens

Returns: `totalValue` in USD.

### All Token Balances

```bash
onchainos portfolio all-balances \
  --address <WALLET_ADDRESS> \
  --chains solana
```

**Parameters:**
- `--address` (required)
- `--chains` (required): Comma-separated, max 50 chains
- `--exclude-risk` (optional, default `"0"`): `0` = filter risky, `1` = include all

**Returns `tokenAssets[]`** per token:
- `chainIndex`, `tokenContractAddress`, `symbol`
- `balance`: Human-readable units (e.g., "1.5" SOL)
- `rawBalance`: Atomic units (e.g., "1500000000" lamports)
- `tokenPrice`: USD price per token
- `isRiskToken`: Boolean risk flag

### Specific Token Balances

```bash
onchainos portfolio token-balances \
  --address <WALLET_ADDRESS> \
  --tokens "501:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v,501:"
```

**Parameters:**
- `--address` (required)
- `--tokens` (required): `chainIndex:tokenAddress` pairs, comma-separated (max 20). Use empty address for native token (e.g., `"501:"` for native SOL)

Returns same `tokenAssets[]` schema as `all-balances`.

---

## Choosing Between OKX Portfolio and Helius Wallet API

| Feature | OKX Portfolio | Helius Wallet API |
|---------|--------------|-------------------|
| USD pricing | Yes | Yes (top 10K tokens, hourly) |
| Risk filtering | Yes | No |
| NFT support | No | Yes (`showNfts`) |
| Identity resolution | No | Yes (Orb-powered) |
| Funding source | No | Yes (`getWalletFundedBy`) |
| Transaction history | No | Yes (`getWalletHistory`) |
| Credits | Uses OKX API | 100 credits/request |

**Use OKX Portfolio when**: You need risk-filtered token lists.
**Use Helius Wallet API when**: You need Solana-specific intelligence — identity, funding source, transaction history, or NFTs. See `references/helius-wallet-api.md`.

---

## Cross-Skill Workflows

### Simulate → Broadcast → Track

```
1. onchainos gateway simulate --from <wallet> --to <program> --data <data> --chain solana
   ↓ simulation passes
2. onchainos gateway broadcast --signed-tx <base58_tx> --address <wallet> --chain solana
3. onchainos gateway orders --address <wallet> --chain solana --order-id <orderId>
```

### Gas Check → Swap

```
1. onchainos gateway gas --chain solana                         → check fees
2. onchainos swap execute --from ... --to ... --chain solana    → one-shot swap (handles broadcast)
```

---

## Error Handling

| Error | Action |
|-------|--------|
| `50125` / `80001` | Region restricted — display: "This service is unavailable in your region" |
| Rate limit | Suggest creating an OKX API key at the Developer Portal |
| Node rejection | Insufficient compute, or program revert — surface cause to user |

## Safety Notes

- OKX Gateway does NOT sign transactions — signing must happen locally
- Solana signed transactions use base58 encoding (not hex)
- Always simulate transactions before broadcasting when possible
- Check `risks[]` in simulation results for drainer contracts or suspicious transfers
- `isRiskToken` flag is supported on Solana

## Common Mistakes

- Broadcasting via OKX Gateway when Helius Sender would give better inclusion rates on Solana
- Using hex encoding for Solana transactions (must be base58)
- Not checking simulation `failReason` before broadcasting
- Forgetting that `--exclude-risk` defaults differ between `total-value` (true) and `all-balances` ("0" = filter)
- Using `total-value` for detailed balances (it only returns a single USD figure)
- Broadcasting same signed tx twice without handling idempotently
