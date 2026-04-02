import { describe, expect, it, vi } from "vitest";
import { playwrightPageSnapshot } from "../src/crawl/playwright-page.js";
import type { BrowserContext } from "playwright";

const extracted = {
  title: "PW Title",
  metaDescription: "desc",
  h1Tags: ["H1"],
  h2Tags: [] as string[],
  h3Tags: [] as string[],
  canonicalUrl: null as string | null,
  ogTitle: null as string | null,
  ogDescription: null as string | null,
  ogImage: null as string | null,
  wordCount: 42,
  internalLinkCount: 1,
  externalLinkCount: 0,
  imagesWithoutAlt: 0,
  jsonLdSnippetCount: 0,
};

function makeMockContext(
  overrides?: Partial<{
    gotoResult: { status: () => number } | null;
    gotoThrows: Error | null;
  }>
): BrowserContext {
  const page = {
    goto: vi
      .fn()
      .mockImplementation(async () => {
        if (overrides?.gotoThrows) throw overrides.gotoThrows;
        return overrides?.gotoResult ?? { status: () => 200 };
      }),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(extracted),
    close: vi.fn().mockResolvedValue(undefined),
  };

  return {
    route: vi.fn().mockResolvedValue(undefined),
    newPage: vi.fn().mockResolvedValue(page),
  } as unknown as BrowserContext;
}

describe("playwrightPageSnapshot", () => {
  it("returns merged snapshot on success", async () => {
    const ctx = makeMockContext();
    const s = await playwrightPageSnapshot(
      ctx,
      "https://ex.com/pw",
      { blockHeavyResources: false }
    );
    expect(s.mode).toBe("playwright");
    expect(s.url).toBe("https://ex.com/pw");
    expect(s.title).toBe("PW Title");
    expect(s.statusCode).toBe(200);
    expect(ctx.route).not.toHaveBeenCalled();
  });

  it("installs resource blocking when blockHeavyResources is true", async () => {
    const ctx = makeMockContext();
    await playwrightPageSnapshot(ctx, "https://ex.com/pw", {
      blockHeavyResources: true,
    });
    expect(ctx.route).toHaveBeenCalled();
  });

  it("waits after load when postLoadDelayMs > 0", async () => {
    const page = {
      goto: vi.fn().mockResolvedValue({ status: () => 200 }),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue(extracted),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const ctx = {
      route: vi.fn().mockResolvedValue(undefined),
      newPage: vi.fn().mockResolvedValue(page),
    } as unknown as BrowserContext;

    await playwrightPageSnapshot(ctx, "https://ex.com/pw", {
      blockHeavyResources: false,
      postLoadDelayMs: 50,
    });
    expect(page.waitForTimeout).toHaveBeenCalledWith(50);
  });

  it("returns error snapshot when goto fails", async () => {
    const ctx = makeMockContext({
      gotoThrows: new Error("timeout"),
    });
    const s = await playwrightPageSnapshot(ctx, "https://ex.com/bad", {
      blockHeavyResources: false,
    });
    expect(s.error).toContain("timeout");
    expect(s.title).toBe("");
  });
});
