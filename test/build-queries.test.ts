import { describe, expect, it } from "vitest";
import { buildResearchQueries } from "../src/research/build-queries.js";
import type { PageSnapshot } from "../src/types.js";

function snap(partial: Partial<PageSnapshot>): PageSnapshot {
  return {
    url: "https://ex.com/",
    fetchedAt: new Date().toISOString(),
    mode: "fetch",
    title: "",
    metaDescription: "",
    h1Tags: [],
    h2Tags: [],
    h3Tags: [],
    canonicalUrl: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    wordCount: 0,
    ...partial,
  };
}

describe("buildResearchQueries", () => {
  it("uses path segments as first query", () => {
    const q = buildResearchQueries(
      snap({ url: "https://ex.com/wedding-photographers/udaipur" }),
      "ex.com"
    );
    expect(q[0]).toContain("wedding");
    expect(q[0]).toContain("udaipur");
  });

  it("adds shortened title before pipe", () => {
    const q = buildResearchQueries(
      snap({
        url: "https://ex.com/p",
        title: "Best Photographers in Goa | Ex",
      }),
      "ex.com"
    );
    expect(q.some((x) => x.includes("Best Photographers"))).toBe(true);
  });

  it("adds first H1", () => {
    const q = buildResearchQueries(
      snap({
        url: "https://ex.com/p",
        title: "short",
        h1Tags: ["Hire professional decorators today"],
      }),
      "ex.com"
    );
    expect(q).toContain("Hire professional decorators today");
  });

  it("falls back to host homepage when nothing else", () => {
    const q = buildResearchQueries(
      snap({ url: "https://ex.com/", title: "x" }),
      "ex.com"
    );
    expect(q.some((s) => s.includes("homepage"))).toBe(true);
  });

  it("ignores invalid page URL in path segment step", () => {
    const q = buildResearchQueries(
      snap({
        url: "not-a-valid-url",
        title: "Long enough title for query building here",
      }),
      "ex.com"
    );
    expect(q.length).toBeGreaterThanOrEqual(1);
    expect(q.some((s) => s.includes("Long enough"))).toBe(true);
  });

  it("caps at 4 queries", () => {
    const q = buildResearchQueries(
      snap({
        url: "https://ex.com/a/b/c/d/e",
        title: "Long enough title here | Brand",
        h1Tags: ["Another heading that is quite long for the page"],
      }),
      "ex.com"
    );
    expect(q.length).toBeLessThanOrEqual(4);
  });
});
