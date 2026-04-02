import { beforeEach, describe, expect, it, vi } from "vitest";

const { launchMock } = vi.hoisted(() => ({
  launchMock: vi.fn(),
}));

vi.mock("playwright", () => ({
  chromium: {
    launch: (opts: unknown) => launchMock(opts),
  },
}));

vi.mock("../src/sitemap/discover.js", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../src/sitemap/discover.js")>();
  return {
    ...mod,
    discoverPageUrlsFromSitemaps: vi.fn(),
  };
});

vi.mock("../src/crawl/fetch-page.js", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../src/crawl/fetch-page.js")>();
  return {
    ...mod,
    fetchPageSnapshot: vi.fn(),
  };
});

vi.mock("../src/research/page-research.js", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../src/research/page-research.js")>();
  return {
    ...mod,
    gatherPageResearch: vi.fn(),
  };
});

vi.mock("../src/suggest/gemini.js", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../src/suggest/gemini.js")>();
  return {
    ...mod,
    suggestSeoWithGemini: vi.fn(),
  };
});

import { discoverPageUrlsFromSitemaps } from "../src/sitemap/discover.js";
import { fetchPageSnapshot } from "../src/crawl/fetch-page.js";
import { gatherPageResearch } from "../src/research/page-research.js";
import { suggestSeoWithGemini } from "../src/suggest/gemini.js";
import { runPipeline } from "../src/pipeline/run.js";

const snapshot = {
  url: "https://ex.com/a",
  fetchedAt: new Date().toISOString(),
  mode: "fetch" as const,
  title: "T",
  metaDescription: "",
  h1Tags: [] as string[],
  h2Tags: [] as string[],
  h3Tags: [] as string[],
  canonicalUrl: null,
  ogTitle: null,
  ogDescription: null,
  ogImage: null,
  wordCount: 0,
};

const research = {
  queriesUsed: [] as string[],
  googleSuggest: [] as string[],
  serpByQuery: [] as [],
};

const pwExtracted = {
  title: "PW",
  metaDescription: "md",
  h1Tags: ["h1"],
  h2Tags: [] as string[],
  h3Tags: [] as string[],
  canonicalUrl: null as string | null,
  ogTitle: null as string | null,
  ogDescription: null as string | null,
  ogImage: null as string | null,
  wordCount: 3,
  internalLinkCount: 0,
  externalLinkCount: 0,
  imagesWithoutAlt: 0,
  jsonLdSnippetCount: 0,
};

describe("runPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    launchMock.mockReset();
    vi.mocked(discoverPageUrlsFromSitemaps).mockResolvedValue([
      "https://ex.com/a",
    ]);
    vi.mocked(fetchPageSnapshot).mockResolvedValue(snapshot);
    vi.mocked(gatherPageResearch).mockResolvedValue(research);
    vi.mocked(suggestSeoWithGemini).mockResolvedValue({
      metaTitle: "MT",
      metaDescription: "MD".repeat(40),
      belowTheFoldMarkdown: "## X",
    });
  });

  it("returns empty when sitemap yields no URLs", async () => {
    vi.mocked(discoverPageUrlsFromSitemaps).mockResolvedValue([]);
    const out = await runPipeline({
      site: { brandName: "E", siteUrl: "https://ex.com" },
      seedSitemaps: ["https://ex.com/sitemap.xml"],
      geminiApiKey: "k",
    });
    expect(out).toEqual([]);
  });

  it("runs crawl, research, and suggestion by default", async () => {
    const out = await runPipeline({
      site: { brandName: "E", siteUrl: "https://ex.com" },
      seedSitemaps: ["https://ex.com/sitemap.xml"],
      limit: 5,
      crawlConcurrency: 2,
      geminiApiKey: "k",
    });
    expect(out).toHaveLength(1);
    expect(out[0].url).toBe("https://ex.com/a");
    expect(out[0].suggestion?.metaTitle).toBe("MT");
    expect(fetchPageSnapshot).toHaveBeenCalled();
    expect(gatherPageResearch).toHaveBeenCalled();
    expect(suggestSeoWithGemini).toHaveBeenCalled();
  });

  it("skipSuggest skips Gemini", async () => {
    await runPipeline({
      site: { brandName: "E", siteUrl: "https://ex.com" },
      seedSitemaps: ["https://ex.com/sitemap.xml"],
      skipSuggest: true,
      geminiApiKey: "k",
    });
    expect(suggestSeoWithGemini).not.toHaveBeenCalled();
  });

  it("records crawl error on snapshot.error", async () => {
    vi.mocked(fetchPageSnapshot).mockResolvedValue({
      ...snapshot,
      error: "timeout",
    });
    const out = await runPipeline({
      site: { brandName: "E", siteUrl: "https://ex.com" },
      seedSitemaps: ["https://ex.com/sitemap.xml"],
      skipSuggest: true,
    });
    expect(out[0].errors.some((e) => e.includes("crawl"))).toBe(true);
  });

  it("records research error and empty bundle", async () => {
    vi.mocked(gatherPageResearch).mockRejectedValue(new Error("suggest fail"));
    const out = await runPipeline({
      site: { brandName: "E", siteUrl: "https://ex.com" },
      seedSitemaps: ["https://ex.com/sitemap.xml"],
      skipSuggest: true,
    });
    expect(out[0].research.googleSuggest).toEqual([]);
    expect(out[0].errors.some((e) => e.includes("research"))).toBe(true);
  });

  it("records suggest error without throwing", async () => {
    vi.mocked(suggestSeoWithGemini).mockRejectedValue(new Error("quota"));
    const out = await runPipeline({
      site: { brandName: "E", siteUrl: "https://ex.com" },
      seedSitemaps: ["https://ex.com/sitemap.xml"],
      geminiApiKey: "k",
    });
    expect(out[0].suggestion).toBeUndefined();
    expect(out[0].errors.some((e) => e.includes("suggest"))).toBe(true);
  });

  it("throws when renderJs is true but Playwright launch fails", async () => {
    launchMock.mockRejectedValue(new Error("install browsers"));
    await expect(
      runPipeline({
        site: { brandName: "E", siteUrl: "https://ex.com" },
        seedSitemaps: ["https://ex.com/sitemap.xml"],
        limit: 1,
        renderJs: true,
        skipSuggest: true,
      })
    ).rejects.toThrow(/renderJs requires/);
  });

  it("uses Playwright path when renderJs is true", async () => {
    const page = {
      goto: vi.fn().mockResolvedValue({ status: () => 201 }),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue(pwExtracted),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const ctx = {
      route: vi.fn().mockResolvedValue(undefined),
      newPage: vi.fn().mockResolvedValue(page),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const browser = {
      newContext: vi.fn().mockResolvedValue(ctx),
      close: vi.fn().mockResolvedValue(undefined),
    };
    launchMock.mockResolvedValue(browser);

    const out = await runPipeline({
      site: { brandName: "E", siteUrl: "https://ex.com" },
      seedSitemaps: ["https://ex.com/sitemap.xml"],
      limit: 1,
      renderJs: true,
      skipSuggest: true,
      blockHeavyResources: false,
    });

    expect(launchMock).toHaveBeenCalled();
    expect(out).toHaveLength(1);
    expect(out[0].snapshot.mode).toBe("playwright");
    expect(out[0].snapshot.title).toBe("PW");
    expect(browser.close).toHaveBeenCalled();
    expect(ctx.close).toHaveBeenCalled();
  });
});
