// Feature-flag client key. Empty unless the operator opts in with an env var —
// do not ship third-party SDK keys in this open-source tree.
export function getGrowthBookClientKey(): string {
  return process.env.GROWTHBOOK_CLIENT_KEY || process.env.CLAWD_GROWTHBOOK_CLIENT_KEY || ''
}

