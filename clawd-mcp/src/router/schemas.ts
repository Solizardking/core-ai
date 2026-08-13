import { z } from 'zod';
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
} from './actions.js';
import { withTelemetry } from './telemetry.js';

const detailField = z.enum(['summary', 'standard', 'full']).optional();
const argsField = z.union([
  z.object({}).passthrough(),
  z.string().transform((s, ctx) => {
    try { return JSON.parse(s); } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'args must be a JSON object string' });
      return z.NEVER;
    }
  }).pipe(z.object({}).passthrough()),
]).optional();

const stringArray = () => z.array(z.string()).optional();
const optionalString = () => z.string().optional();
const optionalNumber = () => z.coerce.number().optional();
const optionalBoolean = () => z.boolean().optional();

export const ClawdAccountActionSchema = z.enum(CLAWD_ACCOUNT_ACTIONS);
export const ClawdWalletActionSchema = z.enum(CLAWD_WALLET_ACTIONS);
export const ClawdAssetActionSchema = z.enum(CLAWD_ASSET_ACTIONS);
export const ClawdTransactionActionSchema = z.enum(CLAWD_TRANSACTION_ACTIONS);
export const ClawdChainActionSchema = z.enum(CLAWD_CHAIN_ACTIONS);
export const ClawdStreamingActionSchema = z.enum(CLAWD_STREAMING_ACTIONS);
export const ClawdKnowledgeActionSchema = z.enum(CLAWD_KNOWLEDGE_ACTIONS);
export const ClawdWriteActionSchema = z.enum(CLAWD_WRITE_ACTIONS);
export const ClawdCompressionActionSchema = z.enum(CLAWD_COMPRESSION_ACTIONS);

export const CLAWD_ACCOUNT_SCHEMA = withTelemetry({
  action: ClawdAccountActionSchema,
  detail: detailField,
  args: argsField,
  apiKey: optionalString(),
  network: optionalString(),
  paymentIntentId: optionalString(),
  plan: optionalString(),
  period: optionalString(),
  couponCode: optionalString(),
  email: optionalString(),
  firstName: optionalString(),
  lastName: optionalString(),
  discoveryPath: optionalString(),
  frictionPoints: optionalString(),
});

export const CLAWD_WALLET_SCHEMA = withTelemetry({
  action: ClawdWalletActionSchema,
  detail: detailField,
  args: argsField,
  address: optionalString(),
  addresses: stringArray(),
  limit: optionalNumber(),
  page: optionalNumber(),
  cursor: optionalString(),
  before: optionalString(),
  after: optionalString(),
  showNfts: optionalBoolean(),
  showZeroBalance: optionalBoolean(),
  showNative: optionalBoolean(),
});

export const CLAWD_ASSET_SCHEMA = withTelemetry({
  action: ClawdAssetActionSchema,
  detail: detailField,
  args: argsField,
  id: optionalString(),
  ids: stringArray(),
  address: optionalString(),
  ownerAddress: optionalString(),
  creatorAddress: optionalString(),
  authorityAddress: optionalString(),
  groupKey: optionalString(),
  groupValue: optionalString(),
  mint: optionalString(),
  limit: optionalNumber(),
  page: optionalNumber(),
  name: optionalString(),
  compressed: optionalBoolean(),
  burnt: optionalBoolean(),
  frozen: optionalBoolean(),
  onlyVerified: optionalBoolean(),
});

export const CLAWD_TRANSACTION_SCHEMA = withTelemetry({
  action: ClawdTransactionActionSchema,
  detail: detailField,
  args: argsField,
  address: optionalString(),
  signature: optionalString(),
  signatures: stringArray(),
  limit: optionalNumber(),
  before: optionalString(),
  until: optionalString(),
  paginationToken: optionalString(),
  sortOrder: optionalString(),
  status: optionalString(),
  mode: optionalString(),
  transactionDetails: optionalString(),
  tokenAccounts: optionalString(),
});

export const CLAWD_CHAIN_SCHEMA = withTelemetry({
  action: ClawdChainActionSchema,
  detail: detailField,
  args: argsField,
  address: optionalString(),
  addresses: stringArray(),
  programId: optionalString(),
  slot: optionalNumber(),
  limit: optionalNumber(),
  page: optionalNumber(),
  stakeAccount: optionalString(),
  accountKeys: stringArray(),
  priorityLevel: optionalString(),
  includeAllLevels: optionalBoolean(),
  encoding: optionalString(),
  dataSize: optionalNumber(),
  owner: optionalString(),
  mint: optionalString(),
});

export const CLAWD_STREAMING_SCHEMA = withTelemetry({
  action: ClawdStreamingActionSchema,
  detail: detailField,
  args: argsField,
  account: optionalString(),
  accountAddresses: stringArray(),
  webhookID: optionalString(),
  webhookURL: optionalString(),
  transactionTypes: stringArray(),
  signature: optionalString(),
  encoding: optionalString(),
  commitment: optionalString(),
  region: optionalString(),
  webhookType: optionalString(),
  accountInclude: stringArray(),
  accountExclude: stringArray(),
  accountRequired: stringArray(),
  subscribeAccounts: stringArray(),
  accountOwners: stringArray(),
  transactionAccountInclude: stringArray(),
  transactionAccountExclude: stringArray(),
  transactionAccountRequired: stringArray(),
});

export const CLAWD_KNOWLEDGE_SCHEMA = withTelemetry({
  action: ClawdKnowledgeActionSchema,
  detail: detailField,
  args: argsField,
  topic: optionalString(),
  section: optionalString(),
  query: optionalString(),
  slug: optionalString(),
  number: optionalString(),
  path: optionalString(),
  category: optionalString(),
  repo: optionalString(),
  branch: optionalString(),
  description: optionalString(),
  budget: optionalString(),
  complexity: optionalString(),
  scale: optionalString(),
  remember: optionalBoolean(),
  errorCode: optionalString(),
});

export const CLAWD_WRITE_SCHEMA = withTelemetry({
  action: ClawdWriteActionSchema,
  detail: detailField,
  args: argsField,
  recipientAddress: optionalString(),
  mintAddress: optionalString(),
  amount: optionalNumber(),
  sendMax: optionalBoolean(),
  stakeAccount: optionalString(),
  destination: optionalString(),
  owsWallet: optionalString(),
});

export const CLAWD_COMPRESSION_SCHEMA = withTelemetry({
  action: ClawdCompressionActionSchema,
  detail: detailField,
  args: argsField,
  address: optionalString(),
  addresses: stringArray(),
  hash: optionalString(),
  hashes: stringArray(),
  owner: optionalString(),
  delegate: optionalString(),
  mint: optionalString(),
  limit: optionalNumber(),
  cursor: optionalString(),
});

export const EXPAND_RESULT_SCHEMA = withTelemetry({
  resultId: z.string(),
  section: optionalString(),
  item: optionalNumber(),
  page: optionalNumber(),
  range: optionalString(),
  continuation: optionalString(),
  detail: detailField,
});
