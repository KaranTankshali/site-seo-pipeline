import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gatherPageResearch } from "../src/research/page-research.js";
import type { PageSnapshot } from "../src/types.js";

vi.mock("../src/research/google-suggest.js", () => ({
  googleSuggest: vi.fn(),
}));

vi.mock("../src/research/serpapi.js", () => ({
  serpApiGoogleSearch: vi.fn(),
}));

import { googleSuggest } from "../src/research/google-suggest.js";
import { serpApiGoogleSearch } from "../src/research/serpapi.js";

const baseSnapshot: PageSnapshot = {
  url: "https://ex.com/services/wedding-planners",
  fetchedAt: new Date().toISOString(),
  mode: "fetch",
  title: "Wedding Planners | Ex",
  metaDescription: "d",
  h1Tags: ["Top planners"],
  h2Tags: [],
  h3Tags: [],
  canonicalUrl: null,
  ogTitle: null,
  ogDescription: null,
  ogImage: null,
  wordCount: 100,
};

describe("gatherPageResearch", () => {
  beforeEach(() => {
    vi.mocked(googleSuggest).mockResolvedValue(["sug1", "sug2"]);
    vi.mocked(serpApiGoogleSearch).mockResolvedValue({
      query: "q1",
      organic: [{ position: 1, title: "Comp", link: "https://c.com", snippet: "sn" }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("merges suggestions and calls SerpAPI when key and slots allow", async () => {
    let slots = 2;
    const bundle = await gatherPageResearch(baseSnapshot, {
      site: {
        brandName: "Ex",
        siteUrl: "https://ex.com",
        locale: "en",
        region: "us",
      },
      suggestDelayMs: 0,
      serpApiKey: "key",
      tryConsumeSerpSlot: () => {
        if (slots <= 0) return false;
        slots -= 1;
        return true;
      },
    });
    expect(bundle.googleSuggest.length).toBeGreaterThan(0);
    expect(bundle.serpByQuery.length).toBe(2);
    expect(serpApiGoogleSearch).toHaveBeenCalledTimes(2);
  });

  it("skips SerpAPI when skipSerp", async () => {
    await gatherPageResearch(baseSnapshot, {
      site: { brandName: "Ex", siteUrl: "https://ex.com" },
      suggestDelayMs: 0,
      skipSerp: true,
      serpApiKey: "key",
    });
    expect(serpApiGoogleSearch).not.toHaveBeenCalled();
  });

  it("skips SerpAPI without API key", async () => {
    await gatherPageResearch(baseSnapshot, {
      site: { brandName: "Ex", siteUrl: "https://ex.com" },
      suggestDelayMs: 0,
    });
    expect(serpApiGoogleSearch).not.toHaveBeenCalled();
  });

  it("continues when SerpAPI throws", async () => {
    vi.mocked(serpApiGoogleSearch).mockRejectedValue(new Error("quota"));
    const bundle = await gatherPageResearch(baseSnapshot, {
      site: { brandName: "Ex", siteUrl: "https://ex.com" },
      suggestDelayMs: 0,
      serpApiKey: "key",
      tryConsumeSerpSlot: () => true,
    });
    expect(bundle.serpByQuery).toEqual([]);
    expect(bundle.googleSuggest.length).toBeGreaterThan(0);
  });

  it("respects Serp slot budget", async () => {
    const bundle = await gatherPageResearch(baseSnapshot, {
      site: { brandName: "Ex", siteUrl: "https://ex.com" },
      suggestDelayMs: 0,
      serpApiKey: "key",
      tryConsumeSerpSlot: () => false,
    });
    expect(bundle.serpByQuery).toEqual([]);
  });
});
