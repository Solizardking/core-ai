import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { dispatchRoutedTool, expandStoredResult } from './dispatch.js';
import { withTelemetryHandler } from './telemetry.js';
import {
  EXPAND_RESULT_SCHEMA,
  CLAWD_ACCOUNT_SCHEMA,
  CLAWD_ASSET_SCHEMA,
  CLAWD_CHAIN_SCHEMA,
  CLAWD_COMPRESSION_SCHEMA,
  CLAWD_KNOWLEDGE_SCHEMA,
  CLAWD_STREAMING_SCHEMA,
  CLAWD_TRANSACTION_SCHEMA,
  CLAWD_WALLET_SCHEMA,
  CLAWD_WRITE_SCHEMA,
} from './schemas.js';

export function registerRouterTools(server: McpServer): void {
  server.tool(
    'clawdAccount',
    'Account setup, API keys, signup, plans, and billing. Use for pricing or account state, not per-method rate limits.',
    CLAWD_ACCOUNT_SCHEMA,
    withTelemetryHandler('clawdAccount', (params, extra) => dispatchRoutedTool('clawdAccount', params, extra)),
  );

  server.tool(
    'clawdWallet',
    'Wallet-centric balances, holdings, identity, and wallet history. Use for portfolio views, not raw token accounts.',
    CLAWD_WALLET_SCHEMA,
    withTelemetryHandler('clawdWallet', (params, extra) => dispatchRoutedTool('clawdWallet', params, extra)),
  );

  server.tool(
    'clawdAsset',
    'Assets, NFTs, collections, proofs, and token holders. Use for DAS ownership or metadata, not transaction history.',
    CLAWD_ASSET_SCHEMA,
    withTelemetryHandler('clawdAsset', (params, extra) => dispatchRoutedTool('clawdAsset', params, extra)),
  );

  server.tool(
    'clawdTransaction',
    'Parsed transactions and wallet transaction history. Use for activity analysis, not raw account state.',
    CLAWD_TRANSACTION_SCHEMA,
    withTelemetryHandler('clawdTransaction', (params, extra) => dispatchRoutedTool('clawdTransaction', params, extra)),
  );

  server.tool(
    'clawdChain',
    'Raw chain state, token accounts, stake reads, blocks, network status, and priority fees. Use for token accounts or blocks, not wallet portfolio summaries.',
    CLAWD_CHAIN_SCHEMA,
    withTelemetryHandler('clawdChain', (params, extra) => dispatchRoutedTool('clawdChain', params, extra)),
  );

  server.tool(
    'clawdStreaming',
    'Webhook CRUD and live subscription configuration. Use for actual webhook/subscription setup, not how-to guides.',
    CLAWD_STREAMING_SCHEMA,
    withTelemetryHandler('clawdStreaming', (params, extra) => dispatchRoutedTool('clawdStreaming', params, extra)),
  );

  server.tool(
    'clawdKnowledge',
    'Docs, guides, pricing references, troubleshooting, source, blog, and SIMD research. Use for guides, rate limits, or errors, not live mutations.',
    CLAWD_KNOWLEDGE_SCHEMA,
    withTelemetryHandler('clawdKnowledge', (params, extra) => dispatchRoutedTool('clawdKnowledge', params, extra)),
  );

  server.tool(
    'clawdWrite',
    'Mutating SOL/token transfer and staking actions. Use for sends or staking, not read-only queries.',
    CLAWD_WRITE_SCHEMA,
    withTelemetryHandler('clawdWrite', (params, extra) => dispatchRoutedTool('clawdWrite', params, extra)),
  );

  server.tool(
    'clawdCompression',
    'Compressed account, proof, balance, and compression history queries. Use for zk-compression state, not standard DAS assets.',
    CLAWD_COMPRESSION_SCHEMA,
    withTelemetryHandler('clawdCompression', (params, extra) => dispatchRoutedTool('clawdCompression', params, extra)),
  );

  server.tool(
    'expandResult',
    'Expand a prior summary-first result by resultId, section, range, page, or continuation.',
    EXPAND_RESULT_SCHEMA,
    withTelemetryHandler('expandResult', (params, extra) => expandStoredResult(params, extra)),
  );
}
