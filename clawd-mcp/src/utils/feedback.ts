import { version } from '../version.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SHARED_CONFIG_PATH } from './config.js';

const POSTHOG_ENDPOINT = process.env.CLAWD_POSTHOG_ENDPOINT;
const POSTHOG_API_KEY = process.env.CLAWD_POSTHOG_API_KEY;
const CONFIG_DIR = SHARED_CONFIG_PATH
  ? path.dirname(SHARED_CONFIG_PATH)
  : path.join(os.homedir(), '.clawd');
const ANON_ID_PATH = path.join(CONFIG_DIR, 'anon-id');

interface FeedbackEvent {
  type: 'tool_call' | 'discovery';
  toolName?: string;
  feedback?: string;
  feedbackTool?: string;
  model?: string;
  discoveryPath?: string;
  frictionPoints?: string;
}

let clientInfo: { name: string; version: string } | null = null;
let walletAddress: string | null = null;
let identifySent = false;

// Persistent anonymous ID shared with clawd-cli.
let sessionId: string;
try {
  if (fs.existsSync(ANON_ID_PATH)) {
    sessionId = fs.readFileSync(ANON_ID_PATH, 'utf-8').trim();
  } else {
    sessionId = crypto.randomUUID();
    try {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
      fs.writeFileSync(ANON_ID_PATH, sessionId, 'utf-8');
    } catch {}
  }
} catch {
  sessionId = crypto.randomUUID();
}

export function captureClientInfo(info: { name: string; version: string }): void {
  clientInfo = info;
}

export function captureWalletAddress(address: string): void {
  const previousId = walletAddress ? null : sessionId;
  walletAddress = address;

  if (previousId && !identifySent) {
    identifySent = true;
    posthogCapture('$identify', {
      distinct_id: address,
      $anon_distinct_id: previousId,
    });
  }
}

function getDistinctId(): string {
  return walletAddress || sessionId;
}

function posthogCapture(event: string, properties: Record<string, unknown>): void {
  if (!POSTHOG_ENDPOINT || !POSTHOG_API_KEY) return;
  fetch(POSTHOG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: POSTHOG_API_KEY,
      event,
      properties,
    }),
  }).catch(() => {
    /* ignore delivery failure */
  });
}

export function sendFeedbackEvent(event: FeedbackEvent): void {
  const eventName = event.type === 'discovery' ? 'agent_discovery' : 'agent_invocation';

  const properties: Record<string, unknown> = {
    distinct_id: getDistinctId(),
    clawd_client: 'clawd-mcp',
    clawd_version: version,
  };

  if (clientInfo) {
    properties.mcp_client = `${clientInfo.name}/${clientInfo.version}`;
  }
  if (event.toolName) properties.current_tool = event.toolName;
  if (event.feedback) properties.feedback = event.feedback;
  if (event.feedbackTool) properties.feedback_tool = event.feedbackTool;
  if (event.model) properties.llm_model = event.model;
  if (event.discoveryPath) properties.discovery_path = event.discoveryPath;
  if (event.frictionPoints) properties.friction_points = event.frictionPoints;

  posthogCapture(eventName, properties);
}
