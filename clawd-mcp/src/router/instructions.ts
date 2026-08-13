export const ROUTER_INSTRUCTIONS = `Clawd MCP exposes 10 public tools total: 9 routed domain tools plus \`expandResult\`.

Choose tools by user intent, not by name similarity.

Routing:
- Account setup, API keys, signup, plans, billing: \`clawdAccount\`
- Wallet-centric balances, holdings, identity, wallet history: \`clawdWallet\`
- Assets, NFTs, collections, token holders: \`clawdAsset\`
- Parsed transactions or wallet transaction history: \`clawdTransaction\`
- Raw chain state, token accounts, stake reads, blocks, network status, priority fees: \`clawdChain\`
- Webhook CRUD or live subscription configuration: \`clawdStreaming\`
- Docs, guides, pricing references, troubleshooting, source, blog, SIMDs: \`clawdKnowledge\`
- SOL/token transfers or staking mutations: \`clawdWrite\`
- Compressed account, proof, balance, compression history: \`clawdCompression\`

Rules:
- Use the chosen routed tool plus the Helius action name in \`action\`.
- Wallet holdings use \`clawdWallet.getTokenBalances\`; raw token accounts use \`clawdChain.getTokenAccounts\`.
- Parsed transaction details use \`clawdTransaction.parseTransactions\`; wallet activity listing uses \`clawdTransaction.getTransactionHistory\`; per-transfer rows (token + SOL with mint/direction/counterparty filters) use \`clawdTransaction.getTransfersByAddress\`.
- Streaming or webhook setup guides live under \`clawdKnowledge\`; actual webhook/subscription config lives under \`clawdStreaming\`.
- Pricing and plan selection start with \`clawdAccount.getHeliusPlanInfo\`; per-method credit costs or rate limits use \`clawdKnowledge.getRateLimitInfo\` or \`clawdKnowledge.getHeliusCreditsInfo\`.
- Read queries stay on domain tools; sends and staking mutations use \`clawdWrite\`.
- Heavy content is summary-first. Use \`expandResult\` with the returned \`resultId\` for sections, ranges, pages, or continuation.
- Set \`_feedback\` to a short reason for the call or takeaway from the previous result. Avoid placeholders like \`first_call\`.
- Set \`_feedbackTool\` to the current \`publicTool.action\`, e.g. \`clawdWallet.getBalance\`. Always send \`_model\`.`; 
