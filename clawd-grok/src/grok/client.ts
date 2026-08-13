import { createXai, type XaiProvider } from "@ai-sdk/xai";
import { generateText } from "ai";
import { getReasoningEffortForModel, getServiceTier } from "../utils/settings.js";
import {
  getEffectiveReasoningEffort,
  getModelInfo,
  type ModelDefinition,
  normalizeModelId,
  usesResponsesApi,
} from "./models.js";

export type { XaiProvider };

const DEFAULT_TITLE_MODEL = "grok-4.20-non-reasoning";
const DEFAULT_RECAP_MODEL = "grok-4.20-non-reasoning";
export const REASONING_REQUEST_TIMEOUT_MS = 3_600_000;
const RETIRED_MODEL_MAP: Record<string, string> = {
  "grok-4-0709": "grok-4.6",
  "grok-code-fast-1": "grok-4.6",
  "grok-4-1-fast-reasoning": "grok-4.6",
  "grok-3": "grok-4.20-non-reasoning",
};

export type ProviderReasoningEffort = "low" | "medium" | "high" | "xhigh";
export type XaiServiceTier = "default" | "priority";

export interface XaiRuntimeProviderOptions {
  xai?: {
    reasoningEffort?: ProviderReasoningEffort;
    previousResponseId?: string;
    serviceTier?: XaiServiceTier;
    store?: boolean;
  };
}

export interface ResolveModelRuntimeOptions {
  previousResponseId?: string;
  serviceTier?: XaiServiceTier;
  store?: boolean;
}

export interface ResolvedModelRuntime {
  model: ReturnType<XaiProvider["chat"]> | ReturnType<XaiProvider["responses"]>;
  modelId: string;
  modelInfo: ModelDefinition | undefined;
  usesResponsesApi: boolean;
  providerOptions?: XaiRuntimeProviderOptions;
}

export function createProvider(apiKey: string, baseURL?: string): XaiProvider {
  return createXai({
    apiKey,
    baseURL: baseURL || process.env.AI_BASE_URL || process.env.GROK_BASE_URL || "https://api.x.ai/v1",
    fetch: wrapXaiFetch(),
  });
}

export function resolveModelRuntime(
  provider: XaiProvider,
  modelId: string,
  options: ResolveModelRuntimeOptions = {},
): ResolvedModelRuntime {
  const normalizedModelId = RETIRED_MODEL_MAP[modelId] ?? normalizeModelId(modelId);
  const info = getModelInfo(normalizedModelId);
  const responses = usesResponsesApi(info);
  const model = responses ? provider.responses(normalizedModelId) : provider.chat(normalizedModelId);
  const normalizedFromAlias = normalizedModelId !== modelId;
  const configuredEffort = getReasoningEffortForModel(normalizedModelId);
  const reasoningEffort = normalizedFromAlias
    ? undefined
    : (getEffectiveReasoningEffort(normalizedModelId, configuredEffort) as ProviderReasoningEffort | undefined);
  const serviceTier = options.serviceTier ?? getServiceTier();
  const previousResponseId = responses ? options.previousResponseId : undefined;
  const store = options.store;

  return {
    model,
    modelId: normalizedModelId,
    modelInfo: info,
    usesResponsesApi: responses,
    providerOptions: buildXaiProviderOptions({
      reasoningEffort,
      previousResponseId,
      serviceTier,
      store,
    }),
  };
}

export function extractResponseId(response: unknown): string | undefined {
  if (!response || typeof response !== "object") return undefined;
  const id = (response as { id?: unknown }).id;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

export function isPreviousResponseNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /previous_response_not_found|previous response .* not found/i.test(message);
}

export interface TitleResult {
  title: string;
  modelId: string;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
}

export async function generateTitle(
  provider: XaiProvider,
  userMessage: string,
  modelId = DEFAULT_TITLE_MODEL,
): Promise<TitleResult> {
  try {
    const result = await generateText({
      model: provider.chat(modelId),
      system: "Generate a short, descriptive title (max 6 words) for this conversation. Return only the title.",
      messages: [{ role: "user", content: userMessage.slice(0, 500) }],
      maxOutputTokens: 32,
    });

    return {
      title: result.text?.trim() || "New session",
      modelId,
      usage: result.usage
        ? {
            inputTokens:
              (result.usage as { inputTokens?: number; promptTokens?: number }).inputTokens ??
              (result.usage as { promptTokens?: number }).promptTokens,
            outputTokens:
              (result.usage as { outputTokens?: number; completionTokens?: number }).outputTokens ??
              (result.usage as { completionTokens?: number }).completionTokens,
            totalTokens: result.usage.totalTokens,
          }
        : undefined,
    };
  } catch {
    return { title: "New session", modelId };
  }
}

export interface RecapResult {
  recap?: string;
  modelId: string;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
}

export async function generateRecap(
  provider: XaiProvider,
  prompt: string,
  signal?: AbortSignal,
  modelId = DEFAULT_RECAP_MODEL,
): Promise<RecapResult> {
  try {
    const result = await generateText({
      model: provider.chat(modelId),
      prompt,
      maxOutputTokens: 120,
      abortSignal: signal,
      system: "You generate concise session recaps. Maximum 3 sentences total. Return only the recap text.",
    });

    return {
      recap: result.text?.trim().replace(/^["']|["']$/g, "") || "",
      modelId,
      usage: result.usage
        ? {
            inputTokens:
              (result.usage as { inputTokens?: number; promptTokens?: number }).inputTokens ??
              (result.usage as { promptTokens?: number }).promptTokens,
            outputTokens:
              (result.usage as { outputTokens?: number; completionTokens?: number }).outputTokens ??
              (result.usage as { completionTokens?: number }).completionTokens,
            totalTokens: result.usage.totalTokens,
          }
        : undefined,
    };
  } catch {
    return { recap: "", modelId };
  }
}

function buildXaiProviderOptions(args: {
  reasoningEffort?: ProviderReasoningEffort;
  previousResponseId?: string;
  serviceTier?: XaiServiceTier;
  store?: boolean;
}): XaiRuntimeProviderOptions | undefined {
  const xai: NonNullable<XaiRuntimeProviderOptions["xai"]> = {};
  if (args.reasoningEffort) xai.reasoningEffort = args.reasoningEffort;
  if (args.previousResponseId) xai.previousResponseId = args.previousResponseId;
  if (args.serviceTier === "priority") xai.serviceTier = "priority";
  if (typeof args.store === "boolean") xai.store = args.store;
  return Object.keys(xai).length > 0 ? { xai } : undefined;
}

function wrapXaiFetch(baseFetch: typeof fetch = fetch): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);
    const timeoutSignal = AbortSignal.timeout(REASONING_REQUEST_TIMEOUT_MS);
    const signal =
      init?.signal && typeof AbortSignal.any === "function"
        ? AbortSignal.any([init.signal, timeoutSignal])
        : (init?.signal ?? timeoutSignal);

    let nextInit: RequestInit = { ...init, signal };
    if (shouldInjectServiceTier(url) && typeof init?.body === "string") {
      try {
        const payload = JSON.parse(init.body) as Record<string, unknown>;
        const tier = getServiceTier();
        if (tier === "priority" && payload.service_tier == null) {
          payload.service_tier = "priority";
          nextInit = { ...nextInit, body: JSON.stringify(payload) };
        }
      } catch {
        // Leave non-JSON bodies unchanged.
      }
    }

    return baseFetch(input, nextInit);
  }) as typeof fetch;
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function shouldInjectServiceTier(url: string): boolean {
  return url.includes("/v1/responses") || url.includes("/v1/chat/completions");
}
