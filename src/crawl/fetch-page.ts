import { pageSnapshotFromHtml } from "./extract-from-html.js";
import type { PageSnapshot } from "../types.js";

export async function fetchPageSnapshot(
  url: string,
  timeoutMs = 45_000
): Promise<PageSnapshot> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; site-seo-pipeline/1.0; +https://npmjs.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const html = await res.text();
    return pageSnapshotFromHtml(url, html, res.status);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      url,
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
      error: msg,
    };
  } finally {
    clearTimeout(t);
  }
}
