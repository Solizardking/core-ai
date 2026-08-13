export const CLAWD_ACCOUNT_ACTIONS = [
  'getStarted',
  'setHeliusApiKey',
  'generateKeypair',
  'signup',
  'getAccountStatus',
  'getAccountPlan',
  'getHeliusPlanInfo',
  'compareHeliusPlans',
  'previewUpgrade',
  'upgradePlan',
  'payRenewal',
  'purchaseCredits',
] as const;

export const CLAWD_WALLET_ACTIONS = [
  'getBalance',
  'getTokenBalances',
  'getWalletBalances',
  'getWalletHistory',
  'getWalletTransfers',
  'getWalletIdentity',
  'batchWalletIdentity',
  'getWalletFundedBy',
] as const;

export const CLAWD_ASSET_ACTIONS = [
  'getAsset',
  'getAssetsByOwner',
  'searchAssets',
  'getAssetsByGroup',
  'getAssetProof',
  'getAssetProofBatch',
  'getSignaturesForAsset',
  'getNftEditions',
  'getTokenHolders',
] as const;

export const CLAWD_TRANSACTION_ACTIONS = [
  'parseTransactions',
  'getTransactionHistory',
  'getTransfersByAddress',
] as const;

export const CLAWD_CHAIN_ACTIONS = [
  'getAccountInfo',
  'getTokenAccounts',
  'getProgramAccounts',
  'getBlock',
  'getNetworkStatus',
  'getPriorityFeeEstimate',
  'getStakeAccounts',
  'getWithdrawableAmount',
] as const;

export const CLAWD_STREAMING_ACTIONS = [
  'createWebhook',
  'getAllWebhooks',
  'getWebhookByID',
  'updateWebhook',
  'deleteWebhook',
  'transactionSubscribe',
  'accountSubscribe',
  'laserstreamSubscribe',
] as const;

export const CLAWD_KNOWLEDGE_ACTIONS = [
  'lookupHeliusDocs',
  'listHeliusDocTopics',
  'getHeliusCreditsInfo',
  'getRateLimitInfo',
  'troubleshootError',
  'recommendStack',
  'getSIMD',
  'listSIMDs',
  'searchSolanaDocs',
  'readSolanaSourceFile',
  'fetchHeliusBlog',
  'getPumpFunGuide',
  'getSenderInfo',
  'getWebhookGuide',
  'getLatencyComparison',
  'getEnhancedWebSocketInfo',
  'getLaserstreamInfo',
] as const;

export const CLAWD_WRITE_ACTIONS = [
  'transferSol',
  'transferToken',
  'stakeSOL',
  'unstakeSOL',
  'withdrawStake',
] as const;

export const CLAWD_COMPRESSION_ACTIONS = [
  'getCompressedAccount',
  'getCompressedAccountsByOwner',
  'getMultipleCompressedAccounts',
  'getCompressedBalance',
  'getCompressedBalanceByOwner',
  'getCompressedMintTokenHolders',
  'getCompressedTokenAccountBalance',
  'getCompressedTokenAccountsByOwner',
  'getCompressedTokenAccountsByDelegate',
  'getCompressedTokenBalancesByOwnerV2',
  'getCompressedAccountProof',
  'getMultipleCompressedAccountProofs',
  'getMultipleNewAddressProofs',
  'getCompressionSignaturesForAccount',
  'getCompressionSignaturesForAddress',
  'getCompressionSignaturesForOwner',
  'getCompressionSignaturesForTokenOwner',
  'getLatestCompressionSignatures',
  'getLatestNonVotingSignatures',
  'getTransactionWithCompressionInfo',
  'getValidityProof',
  'getIndexerHealth',
  'getIndexerSlot',
] as const;

export const ACTION_NAMES = [
  ...CLAWD_ACCOUNT_ACTIONS,
  ...CLAWD_WALLET_ACTIONS,
  ...CLAWD_ASSET_ACTIONS,
  ...CLAWD_TRANSACTION_ACTIONS,
  ...CLAWD_CHAIN_ACTIONS,
  ...CLAWD_STREAMING_ACTIONS,
  ...CLAWD_KNOWLEDGE_ACTIONS,
  ...CLAWD_WRITE_ACTIONS,
  ...CLAWD_COMPRESSION_ACTIONS,
] as const;

export type ActionName = typeof ACTION_NAMES[number];

export const ACTION_NAME_SET = new Set<string>(ACTION_NAMES);
