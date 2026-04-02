import * as cheerio from "cheerio";
import type { PageSnapshot } from "../types.js";

function textLenWords(s: string): number {
  return s.split(/\s+/).filter((w) => w.length > 0).length;
}

function metaContent($: ReturnType<typeof cheerio.load>, name: string): string | null {
  const byName = $(`meta[name="${name}"]`).attr("content");
  if (byName?.trim()) return byName.trim();
  const byProp = $(`meta[property="${name}"]`).attr("content");
  return byProp?.trim() || null;
}

function headings($: ReturnType<typeof cheerio.load>, level: number): string[] {
  const out: string[] = [];
  $(`h${level}`).each((_, el) => {
    const t = $(el).text().trim();
    if (t) out.push(t);
  });
  return out;
}

/**
 * Build a `PageSnapshot` from raw HTML (static / SSR pages).
 */
export function pageSnapshotFromHtml(
  url: string,
  html: string,
  statusCode?: number
): PageSnapshot {
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim();
  const metaDescription = metaContent($, "description") || "";
  const canonicalUrl =
    $('link[rel="canonical"]').attr("href")?.trim() || null;
  const h1Tags = headings($, 1);
  const h2Tags = headings($, 2);
  const h3Tags = headings($, 3);
  const bodyText = $("body").text() || "";
  const wordCount = textLenWords(bodyText);

  let internal = 0;
  let external = 0;
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    host = "";
  }
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.startsWith("#") || href.toLowerCase().startsWith("javascript:"))
      return;
    try {
      const u = new URL(href, url);
      if (u.hostname === host) internal++;
      else external++;
    } catch {
      internal++;
    }
  });

  let imagesWithoutAlt = 0;
  $("img").each((_, el) => {
    const alt = $(el).attr("alt");
    if (!alt?.trim()) imagesWithoutAlt++;
  });

  const jsonLdSnippetCount = $('script[type="application/ld+json"]').length;

  return {
    url,
    fetchedAt: new Date().toISOString(),
    mode: "fetch",
    statusCode,
    title,
    metaDescription,
    h1Tags,
    h2Tags,
    h3Tags,
    canonicalUrl,
    ogTitle: metaContent($, "og:title"),
    ogDescription: metaContent($, "og:description"),
    ogImage: metaContent($, "og:image"),
    wordCount,
    internalLinkCount: internal,
    externalLinkCount: external,
    imagesWithoutAlt,
    jsonLdSnippetCount,
  };
}
