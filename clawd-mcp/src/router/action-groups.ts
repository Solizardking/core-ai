import {
  CLAWD_ACCOUNT_ACTIONS,
  CLAWD_ASSET_ACTIONS,
  CLAWD_CHAIN_ACTIONS,
  CLAWD_COMPRESSION_ACTIONS,
  CLAWD_KNOWLEDGE_ACTIONS,
  CLAWD_STREAMING_ACTIONS,
  CLAWD_TRANSACTION_ACTIONS,
  CLAWD_WALLET_ACTIONS,
  CLAWD_WRITE_ACTIONS,
  type ActionName,
} from './actions.js';

export const PUBLIC_TOOL_NAMES = [
  'clawdAccount',
  'clawdWallet',
  'clawdAsset',
  'clawdTransaction',
  'clawdChain',
  'clawdStreaming',
  'clawdKnowledge',
  'clawdWrite',
  'clawdCompression',
  'expandResult',
] as const;

export type PublicToolName = typeof PUBLIC_TOOL_NAMES[number];
export type RoutedPublicToolName = Exclude<PublicToolName, 'expandResult'>;

export const ACTION_GROUPS: Record<RoutedPublicToolName, readonly ActionName[]> = {
  clawdAccount: CLAWD_ACCOUNT_ACTIONS,
  clawdWallet: CLAWD_WALLET_ACTIONS,
  clawdAsset: CLAWD_ASSET_ACTIONS,
  clawdTransaction: CLAWD_TRANSACTION_ACTIONS,
  clawdChain: CLAWD_CHAIN_ACTIONS,
  clawdStreaming: CLAWD_STREAMING_ACTIONS,
  clawdKnowledge: CLAWD_KNOWLEDGE_ACTIONS,
  clawdWrite: CLAWD_WRITE_ACTIONS,
  clawdCompression: CLAWD_COMPRESSION_ACTIONS,
};

export function findPublicToolForAction(action: ActionName): RoutedPublicToolName {
  for (const [tool, actions] of Object.entries(ACTION_GROUPS) as Array<[RoutedPublicToolName, readonly ActionName[]]>) {
    if (actions.includes(action)) {
      return tool;
    }
  }

  throw new Error(`No public tool mapping found for action "${action}"`);
}
