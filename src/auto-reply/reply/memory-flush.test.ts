import { describe, expect, it, vi } from "vitest";
import type { OpenClawConfig } from "../../config/config.js";
import { resolveMemoryFlushPromptForRun, shouldRunMemoryFlush } from "./memory-flush.js";

describe("resolveMemoryFlushPromptForRun", () => {
  const cfg = {
    agents: {
      defaults: {
        userTimezone: "America/New_York",
        timeFormat: "12",
      },
    },
  } as OpenClawConfig;

  it("replaces YYYY-MM-DD using user timezone and appends current time", () => {
    const prompt = resolveMemoryFlushPromptForRun({
      prompt: "Store durable notes in memory/YYYY-MM-DD.md",
      cfg,
      nowMs: Date.UTC(2026, 1, 16, 15, 0, 0),
    });

    expect(prompt).toContain("memory/2026-02-16.md");
    expect(prompt).toContain("Current time:");
    expect(prompt).toContain("(America/New_York)");
  });

  it("does not append a duplicate current time line", () => {
    const prompt = resolveMemoryFlushPromptForRun({
      prompt: "Store notes.\nCurrent time: already present",
      cfg,
      nowMs: Date.UTC(2026, 1, 16, 15, 0, 0),
    });

    expect(prompt).toContain("Current time: already present");
    expect((prompt.match(/Current time:/g) ?? []).length).toBe(1);
  });
});

describe("shouldRunMemoryFlush", () => {
  it("skips during the memory flush cooldown window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-03T10:00:00.000Z"));

    expect(
      shouldRunMemoryFlush({
        entry: {
          totalTokens: 96_000,
          compactionCount: 1,
          memoryFlushAt: Date.now() - 60_000,
        },
        contextWindowTokens: 100_000,
        reserveTokensFloor: 2_000,
        softThresholdTokens: 1_000,
      }),
    ).toBe(false);

    vi.useRealTimers();
  });
});
