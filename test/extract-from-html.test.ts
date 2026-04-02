import { describe, expect, it } from "vitest";
import { pageSnapshotFromHtml } from "../src/crawl/extract-from-html.js";

const sampleHtml = `<!DOCTYPE html>
<html><head>
  <title>Full Title | Brand</title>
  <meta name="description" content="Meta desc here" />
  <meta property="og:title" content="OG Title" />
  <meta property="og:description" content="OG Desc" />
  <meta property="og:image" content="https://ex.com/i.png" />
  <link rel="canonical" href="https://ex.com/canonical" />
  <script type="application/ld+json">{}</script>
</head><body>
  <h1>Main H1</h1>
  <h2>Section</h2>
  <p>One two three four five.</p>
  <a href="/internal">in</a>
  <a href="https://other.com/o">out</a>
  <a href="#hash">skip</a>
  <a href="javascript:void(0)">js</a>
  <img src="/a.png" alt="ok" />
  <img src="/b.png" />
</body></html>`;

describe("pageSnapshotFromHtml", () => {
  it("extracts title, meta, headings, canonical, og", () => {
    const s = pageSnapshotFromHtml("https://ex.com/p", sampleHtml, 200);
    expect(s.url).toBe("https://ex.com/p");
    expect(s.mode).toBe("fetch");
    expect(s.statusCode).toBe(200);
    expect(s.title).toBe("Full Title | Brand");
    expect(s.metaDescription).toBe("Meta desc here");
    expect(s.h1Tags).toEqual(["Main H1"]);
    expect(s.h2Tags).toEqual(["Section"]);
    expect(s.canonicalUrl).toBe("https://ex.com/canonical");
    expect(s.ogTitle).toBe("OG Title");
    expect(s.ogDescription).toBe("OG Desc");
    expect(s.ogImage).toBe("https://ex.com/i.png");
    expect(s.jsonLdSnippetCount).toBe(1);
  });

  it("counts internal vs external links", () => {
    const s = pageSnapshotFromHtml("https://ex.com/p", sampleHtml);
    expect(s.internalLinkCount).toBe(1);
    expect(s.externalLinkCount).toBe(1);
  });

  it("counts images missing alt", () => {
    const s = pageSnapshotFromHtml("https://ex.com/p", sampleHtml);
    expect(s.imagesWithoutAlt).toBe(1);
  });

  it("wordCount is positive for body text", () => {
    const s = pageSnapshotFromHtml("https://ex.com/p", sampleHtml);
    expect(s.wordCount).toBeGreaterThanOrEqual(5);
  });

  it("counts malformed href as internal when base URL is invalid", () => {
    const s = pageSnapshotFromHtml(
      "not-a-url",
      '<html><body><a href="https://outside.com/x">out</a></body></html>'
    );
    expect(s.internalLinkCount).toBeGreaterThanOrEqual(1);
  });

  it("handles empty body gracefully", () => {
    const s = pageSnapshotFromHtml(
      "https://ex.com/",
      "<html><head><title>T</title></head><body></body></html>"
    );
    expect(s.title).toBe("T");
    expect(s.wordCount).toBe(0);
  });
});
