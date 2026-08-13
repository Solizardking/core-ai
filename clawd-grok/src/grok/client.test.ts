import { createXai } from "@ai-sdk/xai";
import type { generateText } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as settings from "../utils/settings.js";
import {
  applyXaiRequestOverrides,
  extractResponseId,
  generateRecap,
  isPreviousResponseNotFoundError,
  resolveModelRuntime,
} from "./client.js";

const mockGenerateText = vi.hoisted(() => vi.fn());

vi.mock("ai", () => {
  return {
    generateText: mockGenerateText,
  };
});

describe("client", () => {
  const mockProvider = createXai({
    apiKey: "test-key",
    baseURL: "https://api.x.ai/v1",
  });

  describe("generateRecap", () => {
    beforeEach(() => {
      mockGenerateText.mockReset();
    });

    it("generates a normalized recap with the recap prompt contract", async () => {
      const signal = new AbortController().signal;
      mockGenerateText.mockResolvedValue({
        text: ' "Wrapped up the parser fix. Next step is wiring the new recap banner." ',
        usage: { inputTokens: 11, outputTokens: 7, totalTokens: 18 },
      } as Awaited<ReturnType<typeof generateText>>);

      const result = await generateRecap(mockProvider, "transcript body", signal);

      expect(result).toEqual({
        recap: "Wrapped up the parser fix. Next step is wiring the new recap banner.",
        modelId: "grok-4.20-non-reasoning",
        usage: { inputTokens: 11, outputTokens: 7, totalTokens: 18 },
      });
      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          abortSignal: signal,
          maxOutputTokens: 120,
          prompt: "transcript body",
          system: expect.stringContaining("Maximum 3 sentences total"),
        }),
      );
    });

    it("returns an empty recap when generation fails", async () => {
      mockGenerateText.mockRejectedValue(new Error("boom"));

      const result = await generateRecap(mockProvider, "transcript body");

      expect(result).toEqual({
        recap: "",
        modelId: "grok-4.20-non-reasoning",
      });
    });
  });

  describe("response helpers", () => {
    it("extracts a response id from the Responses API payload", () => {
      expect(extractResponseId({ id: "resp_123" })).toBe("resp_123");
      expect(extractResponseId({})).toBeUndefined();
      expect(extractResponseId(null)).toBeUndefined();
    });

    it("detects previous_response_not_found errors", () => {
      expect(isPreviousResponseNotFoundError(new Error("previous_response_not_found"))).toBe(true);
      expect(isPreviousResponseNotFoundError("Previous response with id 'resp_abc' not found.")).toBe(true);
      expect(isPreviousResponseNotFoundError(new Error("rate limit"))).toBe(false);
    });
  });

  describe("resolveModelRuntime", () => {
    describe("without configured reasoning effort", () => {
      it("uses the Responses API for grok-4.6", () => {
        const responsesSpy = vi.spyOn(mockProvider, "responses");
        const chatSpy = vi.spyOn(mockProvider, "chat");
        const runtime = resolveModelRuntime(mockProvider, "grok-4.6");
        expect(runtime.modelId).toBe("grok-4.6");
        expect(runtime.usesResponsesApi).toBe(true);
        expect(runtime.providerOptions).toBeUndefined();
        expect(responsesSpy).toHaveBeenCalledWith("grok-4.6");
        expect(chatSpy).not.toHaveBeenCalled();
        responsesSpy.mockRestore();
        chatSpy.mockRestore();
      });

      it("does not include providerOptions for grok-3-mini when no effort configured", () => {
        const runtime = resolveModelRuntime(mockProvider, "grok-3-mini");
        expect(runtime.modelId).toBe("grok-3-mini");
        expect(runtime.usesResponsesApi).toBe(false);
        expect(runtime.providerOptions).toBeUndefined();
      });

      it("normalizes retired flagship reasoning models to grok-4.6", () => {
        const runtime = resolveModelRuntime(mockProvider, "grok-4-0709");
        expect(runtime.modelId).toBe("grok-4.6");
        expect(runtime.usesResponsesApi).toBe(true);
        expect(runtime.providerOptions).toBeUndefined();
      });

      it("normalizes retired code models to grok-4.6", () => {
        const runtime = resolveModelRuntime(mockProvider, "grok-code-fast-1");
        expect(runtime.modelId).toBe("grok-4.6");
        expect(runtime.providerOptions).toBeUndefined();
      });

      it("normalizes retired fast reasoning models to grok-4.6", () => {
        const runtime = resolveModelRuntime(mockProvider, "grok-4-1-fast-reasoning");
        expect(runtime.modelId).toBe("grok-4.6");
        expect(runtime.providerOptions).toBeUndefined();
      });

      it("does not include providerOptions for grok-4.20-multi-agent", () => {
        const runtime = resolveModelRuntime(mockProvider, "grok-4.20-multi-agent");
        expect(runtime.modelId).toBe("grok-4.20-multi-agent-0309");
        expect(runtime.usesResponsesApi).toBe(true);
        expect(runtime.providerOptions).toBeUndefined();
      });

      it("normalizes retired non-reasoning models to grok-4.20-non-reasoning", () => {
        const runtime = resolveModelRuntime(mockProvider, "grok-3");
        expect(runtime.modelId).toBe("grok-4.20-non-reasoning");
        expect(runtime.providerOptions).toBeUndefined();
      });
    });

    describe("with configured reasoning effort", () => {
      beforeEach(() => {
        vi.spyOn(settings, "getReasoningEffortForModel");
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it("includes providerOptions with reasoningEffort for grok-4.6 when effort is configured", () => {
        vi.spyOn(settings, "getReasoningEffortForModel").mockReturnValue("xhigh");
        const runtime = resolveModelRuntime(mockProvider, "grok-4.6");
        expect(runtime.modelId).toBe("grok-4.6");
        expect(runtime.providerOptions).toEqual({
          xai: {
            reasoningEffort: "xhigh",
          },
        });
      });

      it("keeps reasoning effort when resolving grok-4.6 aliases", () => {
        vi.spyOn(settings, "getReasoningEffortForModel").mockReturnValue("medium");
        const runtime = resolveModelRuntime(mockProvider, "grok");
        expect(runtime.modelId).toBe("grok-4.6");
        expect(runtime.providerOptions).toEqual({
          xai: {
            reasoningEffort: "medium",
          },
        });
      });

      it("chains previousResponseId on grok-4.6 Responses API turns", () => {
        const runtime = resolveModelRuntime(mockProvider, "grok-4.6", {
          previousResponseId: "resp_abc",
        });
        expect(runtime.providerOptions).toEqual({
          xai: {
            previousResponseId: "resp_abc",
          },
        });
      });

      it("includes providerOptions with reasoningEffort for grok-3-mini when effort is configured", () => {
        vi.spyOn(settings, "getReasoningEffortForModel").mockReturnValue("high");
        const runtime = resolveModelRuntime(mockProvider, "grok-3-mini");
        expect(runtime.modelId).toBe("grok-3-mini");
        expect(runtime.providerOptions).toEqual({
          xai: {
            reasoningEffort: "high",
          },
        });
      });

      it("includes providerOptions with low effort for grok-3-mini when configured", () => {
        vi.spyOn(settings, "getReasoningEffortForModel").mockReturnValue("low");
        const runtime = resolveModelRuntime(mockProvider, "grok-3-mini");
        expect(runtime.modelId).toBe("grok-3-mini");
        expect(runtime.providerOptions).toEqual({
          xai: {
            reasoningEffort: "low",
          },
        });
      });

      it("maps multi-agent reasoning effort to agent count", () => {
        vi.spyOn(settings, "getReasoningEffortForModel").mockReturnValue("high");
        const runtime = resolveModelRuntime(mockProvider, "grok-4.20-multi-agent");
        expect(runtime.modelId).toBe("grok-4.20-multi-agent-0309");
        expect(runtime.providerOptions).toEqual({
          xai: {
            reasoningEffort: "high",
          },
        });
      });

      it("does not include providerOptions for retired reasoning aliases even when effort is configured", () => {
        vi.spyOn(settings, "getReasoningEffortForModel").mockReturnValue("high");
        const runtime = resolveModelRuntime(mockProvider, "grok-4-0709");
        expect(runtime.modelId).toBe("grok-4.6");
        expect(runtime.providerOptions).toBeUndefined();
      });

      it("does not include providerOptions for retired code aliases even when effort is configured", () => {
        vi.spyOn(settings, "getReasoningEffortForModel").mockReturnValue("high");
        const runtime = resolveModelRuntime(mockProvider, "grok-code-fast-1");
        expect(runtime.modelId).toBe("grok-4.6");
        expect(runtime.providerOptions).toBeUndefined();
      });

      it("does not include providerOptions for grok-4.3 even when effort is configured", () => {
        vi.spyOn(settings, "getReasoningEffortForModel").mockReturnValue("high");
        const runtime = resolveModelRuntime(mockProvider, "grok-4.3");
        expect(runtime.modelId).toBe("grok-4.3");
        expect(runtime.providerOptions).toBeUndefined();
      });
    });
  });

  describe("applyXaiRequestOverrides", () => {
    const originalEffort = process.env.GROK_REASONING_EFFORT;
    const originalXaiEffort = process.env.XAI_REASONING_EFFORT;
    const originalTier = process.env.GROK_SERVICE_TIER;
    const originalXaiTier = process.env.XAI_SERVICE_TIER;

    afterEach(() => {
      restoreEnv("GROK_REASONING_EFFORT", originalEffort);
      restoreEnv("XAI_REASONING_EFFORT", originalXaiEffort);
      restoreEnv("GROK_SERVICE_TIER", originalTier);
      restoreEnv("XAI_SERVICE_TIER", originalXaiTier);
    });

    it("injects xhigh reasoning, encrypted thinking, and priority on Responses requests", () => {
      process.env.GROK_REASONING_EFFORT = "xhigh";
      process.env.GROK_SERVICE_TIER = "priority";
      const body = applyXaiRequestOverrides(
        "https://api.x.ai/v1/responses",
        JSON.stringify({ model: "grok-4.6", input: [] }),
      );
      expect(JSON.parse(body)).toEqual({
        model: "grok-4.6",
        input: [],
        reasoning: { effort: "xhigh" },
        include: ["reasoning.encrypted_content"],
        service_tier: "priority",
      });
    });
  });
});

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
