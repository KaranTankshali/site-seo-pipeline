import {
  isSameSite,
  normalizePageUrl,
} from "./url-utils.js";

/** `<loc>` with optional CDATA */
export function extractLocsFromSitemapXml(xml: string): string[] {
  const out: string[] = [];
  const re =
    /<loc>\s*(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]+))\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const raw = (m[1] || m[2] || "").trim();
    if (raw) out.push(raw);
  }
  return out;
}

export function isSitemapIndexXml(xml: string): boolean {
  return /<sitemapindex[\s>]/i.test(xml);
}

export async function fetchTextWithTimeout(
  url: string,
  timeoutMs: number
): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "site-seo-pipeline/1.0 (+https://npmjs.com)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function normalizeSitemapUrl(raw: string): string {
  return normalizePageUrl(raw);
}

/**
 * Walk sitemap index(es) and collect page URLs from urlsets.
 * Filters to same site as `baseOrigin` (www / apex treated as same).
 */
export async function discoverPageUrlsFromSitemaps(
  seedSitemaps: string[],
  baseOrigin: string,
  options?: {
    maxFetches?: number;
    fetchTimeoutMs?: number;
    includeUrl?: (url: string) => boolean;
  }
): Promise<string[]> {
  const maxFetches = options?.maxFetches ?? 2000;
  const fetchTimeoutMs = options?.fetchTimeoutMs ?? 60_000;
  const includeUrl = options?.includeUrl ?? (() => true);

  const queue = [...seedSitemaps];
  const seenSitemaps = new Set<string>();
  const pageUrls = new Set<string>();
  let fetches = 0;

  while (queue.length > 0 && fetches < maxFetches) {
    const raw = queue.shift()!;
    let smUrl: string;
    try {
      smUrl = normalizeSitemapUrl(raw);
    } catch {
      continue;
    }
    if (seenSitemaps.has(smUrl)) continue;
    seenSitemaps.add(smUrl);

    let xml: string;
    try {
      xml = await fetchTextWithTimeout(smUrl, fetchTimeoutMs);
      fetches += 1;
    } catch {
      continue;
    }

    const locs = extractLocsFromSitemapXml(xml);
    if (isSitemapIndexXml(xml)) {
      for (const loc of locs) {
        try {
          const child = normalizeSitemapUrl(loc);
          if (!seenSitemaps.has(child)) queue.push(loc);
        } catch {
          queue.push(loc);
        }
      }
    } else {
      for (const loc of locs) {
        if (!isSameSite(loc, baseOrigin)) continue;
        let pageNorm: string;
        try {
          pageNorm = normalizePageUrl(loc);
        } catch {
          continue;
        }
        if (includeUrl(pageNorm)) pageUrls.add(pageNorm);
      }
    }
  }

  return Array.from(pageUrls).sort();
}
