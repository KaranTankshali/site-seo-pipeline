import { afterEach, describe, expect, it, vi } from "vitest";
import { serpApiGoogleSearch } from "../src/research/serpapi.js";

describe("serpApiGoogleSearch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const fullJson = {
    organic_results: [
      { position: 1, title: "T1", link: "https://a.com", snippet: "S1" },
      { position: 2, title: "", link: "https://b.com", snippet: "S2" },
      {},
    ],
    related_searches: [{ query: "r1" }, { query: "r2" }],
    related_questions: [
      { question: "Q1?", snippet: "A1" },
      { question: "Q2?" },
    ],
  };

  it("parses organic, related, and PAA", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(fullJson),
      })
    );
    const r = await serpApiGoogleSearch("my query", {
      apiKey: "k",
      locale: "en",
      region: "us",
    });
    expect(r.query).toBe("my query");
    expect(r.organic.length).toBe(2);
    expect(r.organic[0]).toMatchObject({
      position: 1,
      title: "T1",
      link: "https://a.com",
    });
    expect(r.relatedSearches).toEqual(["r1", "r2"]);
    expect(r.peopleAlsoAsk?.[0]).toMatchObject({ question: "Q1?", snippet: "A1" });
  });

  it("omits optional arrays when empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ organic_results: [] }),
      })
    );
    const r = await serpApiGoogleSearch("q", { apiKey: "k" });
    expect(r.organic).toEqual([]);
    expect(r.relatedSearches).toBeUndefined();
    expect(r.peopleAlsoAsk).toBeUndefined();
  });

  it("throws on HTTP error with SerpAPI error field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Invalid API key" }),
      })
    );
    await expect(
      serpApiGoogleSearch("q", { apiKey: "bad" })
    ).rejects.toThrow("Invalid API key");
  });

  it("throws on HTTP error without JSON error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      })
    );
    await expect(serpApiGoogleSearch("q", { apiKey: "k" })).rejects.toThrow(
      "HTTP 500"
    );
  });
});
