import { describe, expect, it } from "vitest";
import {
  getArgFromArgv,
  hasFlagInArgv,
  parseCliConfig,
} from "../src/cli.js";

describe("getArgFromArgv / hasFlagInArgv", () => {
  it("reads flag value", () => {
    expect(
      getArgFromArgv(["node", "x", "--limit", "12", "--tail"], "--limit")
    ).toBe("12");
  });

  it("returns null when flag missing", () => {
    expect(getArgFromArgv(["a", "b"], "--missing")).toBeNull();
  });

  it("detects boolean flag", () => {
    expect(hasFlagInArgv(["--skip-serp", "other"], "--skip-serp")).toBe(true);
  });
});

describe("parseCliConfig", () => {
  it("returns usage error without sitemap", () => {
    const r = parseCliConfig([], {}, "/tmp");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.exitCode).toBe(1);
      expect(r.stderr).toContain("Usage");
    }
  });

  it("reads sitemap from argv", () => {
    const r = parseCliConfig(
      ["--sitemap", "https://ex.com/sitemap.xml", "--brand", "Ex"],
      {},
      "/tmp"
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.seedSitemaps).toEqual(["https://ex.com/sitemap.xml"]);
      expect(r.site.brandName).toBe("Ex");
      expect(r.site.siteUrl).toBe("https://ex.com");
    }
  });

  it("reads sitemap from env", () => {
    const r = parseCliConfig(
      [],
      { SEO_SITEMAP_URL: "https://ex.com/sm.xml" },
      "/cwd"
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.seedSitemaps[0]).toBe("https://ex.com/sm.xml");
    }
  });

  it("applies skip flags and limits", () => {
    const r = parseCliConfig(
      [
        "--sitemap",
        "https://ex.com/s.xml",
        "--skip-serp",
        "--skip-suggest",
        "--limit",
        "3",
        "--crawl-concurrency",
        "2",
        "--max-serp-calls",
        "10",
      ],
      {},
      "/tmp"
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.skipSerp).toBe(true);
      expect(r.skipSuggest).toBe(true);
      expect(r.limit).toBe(3);
      expect(r.crawlConcurrency).toBe(2);
      expect(r.maxSerpCalls).toBe(10);
    }
  });

  it("warns when API keys missing", () => {
    const r = parseCliConfig(
      ["--sitemap", "https://ex.com/s.xml"],
      {},
      "/tmp"
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("no key warnings when skip flags set", () => {
    const r = parseCliConfig(
      ["--sitemap", "https://ex.com/s.xml", "--skip-serp", "--skip-suggest"],
      {},
      "/tmp"
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings).toEqual([]);
    }
  });

  it("returns error for invalid site URL derived from brand resolution", () => {
    const r = parseCliConfig(
      ["--sitemap", "not-a-valid-url"],
      { SITE_URL: "%%%bad" },
      "/tmp"
    );
    expect(r.ok).toBe(false);
  });
});
