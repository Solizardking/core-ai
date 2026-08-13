import { describe, expect, it } from "vitest";
import {
  DEFAULT_IMAGE_MODEL,
  DEFAULT_MODEL,
  DEFAULT_VIDEO_MODEL,
  GROK_46_REASONING_EFFORTS,
  getEffectiveReasoningEffort,
  getModelInfo,
  getSupportedReasoningEfforts,
  MULTI_AGENT_REASONING_EFFORTS,
  normalizeModelId,
  usesResponsesApi,
} from "./models.js";

describe("models", () => {
  it("keeps the default model on Grok 4.6", () => {
    expect(DEFAULT_MODEL).toBe("grok-4.6");
    expect(DEFAULT_IMAGE_MODEL).toBe("grok-imagine-image-quality");
    expect(DEFAULT_VIDEO_MODEL).toBe("grok-imagine-video-1.5");
  });

  it("normalizes aliases to canonical ids", () => {
    expect(normalizeModelId("grok-4-6")).toBe("grok-4.6");
    expect(normalizeModelId("grok")).toBe("grok-4.6");
    expect(normalizeModelId("grok-latest")).toBe("grok-4.6");
    expect(normalizeModelId("grok-4-1-fast")).toBe("grok-4.3");
    expect(normalizeModelId("xai/grok-code-fast-1")).toBe("grok-4.3");
    expect(normalizeModelId("grok-4.20-0309-non-reasoning")).toBe("grok-4.20-non-reasoning");
    expect(normalizeModelId("x-ai/grok-3")).toBe("grok-4.20-non-reasoning");
    expect(normalizeModelId("grok-4.20-multi-agent")).toBe("grok-4.20-multi-agent-0309");
    expect(normalizeModelId("x-ai/grok-4.20-multi-agent-beta")).toBe("grok-4.20-multi-agent-0309");
  });

  it("returns model metadata for aliased ids", () => {
    expect(getModelInfo("grok")?.id).toBe("grok-4.6");
    expect(getModelInfo("grok-4.6")?.preferResponses).toBe(true);
    expect(getModelInfo("grok-4.6")?.reasoning).toBe(true);
    expect(getModelInfo("grok-4.6")?.supportsClientTools).toBe(true);
    expect(getModelInfo("grok-4-1-fast")?.id).toBe("grok-4.3");
    expect(getModelInfo("grok-4.20-multi-agent")?.responsesOnly).toBe(true);
    expect(getModelInfo("grok-4.20-multi-agent")?.supportsClientTools).toBe(false);
    expect(getModelInfo("grok-4.20-multi-agent")?.supportsMaxOutputTokens).toBe(false);
  });

  it("prefers the Responses API for grok-4.6 and multi-agent", () => {
    expect(usesResponsesApi("grok-4.6")).toBe(true);
    expect(usesResponsesApi("grok-4.20-multi-agent")).toBe(true);
    expect(usesResponsesApi("grok-4.3")).toBe(false);
    expect(usesResponsesApi("grok-4.20-non-reasoning")).toBe(false);
  });

  it("reports supported reasoning-effort levels", () => {
    expect(getSupportedReasoningEfforts("grok-4.6")).toEqual([...GROK_46_REASONING_EFFORTS]);
    expect(getSupportedReasoningEfforts("grok-3-mini")).toEqual(["low", "high"]);
    expect(getSupportedReasoningEfforts("grok-4.20-multi-agent-0309")).toEqual([...MULTI_AGENT_REASONING_EFFORTS]);
    expect(getSupportedReasoningEfforts("grok-4.3")).toEqual([]);
    expect(getSupportedReasoningEfforts("grok-4.20-non-reasoning")).toEqual([]);
    expect(getSupportedReasoningEfforts("grok-code-fast-1")).toEqual([]);
    expect(getSupportedReasoningEfforts("grok-3")).toEqual([]);
  });

  it("resolves effective reasoning effort with defaults and overrides", () => {
    expect(getEffectiveReasoningEffort("grok-4.6")).toBeUndefined();
    expect(getEffectiveReasoningEffort("grok-4.6", "xhigh")).toBe("xhigh");
    expect(getEffectiveReasoningEffort("grok-4.6", "medium")).toBe("medium");
    expect(getEffectiveReasoningEffort("grok-4.6", "invalid")).toBeUndefined();
    expect(getEffectiveReasoningEffort("grok-3-mini")).toBeUndefined();
    expect(getEffectiveReasoningEffort("grok-3-mini", "high")).toBe("high");
    expect(getEffectiveReasoningEffort("grok-3-mini", "low")).toBe("low");
    expect(getEffectiveReasoningEffort("grok-4.20-multi-agent-0309")).toBeUndefined();
    expect(getEffectiveReasoningEffort("grok-4.20-multi-agent-0309", "high")).toBe("high");
    expect(getEffectiveReasoningEffort("grok-4.20-multi-agent-0309", "low")).toBe("low");
    expect(getEffectiveReasoningEffort("grok-4.3")).toBeUndefined();
    expect(getEffectiveReasoningEffort("grok-code-fast-1", "high")).toBeUndefined();
  });
});
