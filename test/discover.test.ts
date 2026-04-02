import { afterEach, describe, expect, it, vi } from "vitest";
import {
  discoverPageUrlsFromSitemaps,
  extractLocsFromSitemapXml,
  fetchTextWithTimeout,
  isSitemapIndexXml,
} from "../src/sitemap/discover.js";

describe("extractLocsFromSitemapXml", () => {
  it("parses plain loc tags", () => {
    const xml = `<?xml version="1.0"?><urlset><url><loc>https://a.com/x</loc></url></urlset>`;
    expect(extractLocsFromSitemapXml(xml)).toEqual(["https://a.com/x"]);
  });

  it("parses CDATA loc", () => {
    const xml = `<loc><![CDATA[https://a.com/cdata]]></loc>`;
    expect(extractLocsFromSitemapXml(xml)).toEqual(["https://a.com/cdata"]);
  });

  it("collects multiple locs", () => {
    const xml = `<loc>https://a.com/1</loc><loc>https://a.com/2</loc>`;
    expect(extractLocsFromSitemapXml(xml)).toEqual([
      "https://a.com/1",
      "https://a.com/2",
    ]);
  });
});

describe("isSitemapIndexXml", () => {
  it("detects sitemap index", () => {
    expect(isSitemapIndexXml(`<sitemapindex xmlns="...">`)).toBe(true);
  });

  it("returns false for urlset", () => {
    expect(isSitemapIndexXml(`<urlset>`)).toBe(false);
  });
});

describe("fetchTextWithTimeout", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns text on OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("<xml/>"),
      })
    );
    const t = await fetchTextWithTimeout("https://x/sitemap.xml", 5000);
    expect(t).toBe("<xml/>");
  });

  it("throws on non-OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve(""),
      })
    );
    await expect(
      fetchTextWithTimeout("https://x/sitemap.xml", 5000)
    ).rejects.toThrow("HTTP 404");
  });
});

describe("discoverPageUrlsFromSitemaps", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("follows index then collects same-origin urls", async () => {
    const indexXml = `<?xml version="1.0"?>
      <sitemapindex>
        <sitemap><loc>https://example.com/nested.xml</loc></sitemap>
      </sitemapindex>`;
    const urlsetXml = `<?xml version="1.0"?>
      <urlset>
        <url><loc>https://example.com/page-a</loc></url>
        <url><loc>https://other.com/x</loc></url>
      </urlset>`;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (String(url).includes("nested.xml")) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(urlsetXml),
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(indexXml),
        });
      })
    );

    const urls = await discoverPageUrlsFromSitemaps(
      ["https://example.com/sitemap.xml"],
      "https://example.com",
      { maxFetches: 10, fetchTimeoutMs: 5000 }
    );
    expect(urls).toEqual(["https://example.com/page-a"]);
  });

  it("respects includeUrl filter", async () => {
    const urlsetXml = `<urlset>
      <url><loc>https://ex.com/keep</loc></url>
      <url><loc>https://ex.com/skip</loc></url>
    </urlset>`;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(urlsetXml),
      })
    );
    const urls = await discoverPageUrlsFromSitemaps(
      ["https://ex.com/s.xml"],
      "https://ex.com",
      {
        maxFetches: 5,
        fetchTimeoutMs: 5000,
        includeUrl: (u) => u.includes("/keep"),
      }
    );
    expect(urls).toEqual(["https://ex.com/keep"]);
  });

  it("skips failed fetches and returns empty when all fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network"))
    );
    const urls = await discoverPageUrlsFromSitemaps(
      ["https://ex.com/bad.xml"],
      "https://ex.com",
      { maxFetches: 3, fetchTimeoutMs: 1000 }
    );
    expect(urls).toEqual([]);
  });
});
