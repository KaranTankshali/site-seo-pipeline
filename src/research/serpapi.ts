import type { SerpResearch, SerpOrganicResult } from "../types.js";

export interface SerpApiSearchOptions {
  apiKey: string;
  /** Google `gl` */
  region?: string;
  /** Google `hl` */
  locale?: string;
  timeoutMs?: number;
}

/**
 * [SerpAPI](https://serpapi.com/) — Google organic results, related searches, People Also Ask.
 */
export async function serpApiGoogleSearch(
  query: string,
  options: SerpApiSearchOptions
): Promise<SerpResearch> {
  const params = new URLSearchParams({
    engine: "google",
    q: query,
    api_key: options.apiKey,
  });
  if (options.region) params.set("gl", options.region);
  if (options.locale) params.set("hl", options.locale);

  const url = `https://serpapi.com/search.json?${params.toString()}`;
  const timeoutMs = options.timeoutMs ?? 60_000;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const raw: unknown = await res.json();

    if (!res.ok) {
      const err =
        typeof raw === "object" && raw !== null && "error" in raw
          ? String((raw as { error: string }).error)
          : `HTTP ${res.status}`;
      throw new Error(err);
    }

    return parseSerpApiGoogleJson(query, raw);
  } finally {
    clearTimeout(t);
  }
}

function parseSerpApiGoogleJson(query: string, raw: unknown): SerpResearch {
  const organic: SerpOrganicResult[] = [];
  const obj = raw as Record<string, unknown>;
  const org = obj.organic_results;
  if (Array.isArray(org)) {
    for (const row of org) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const title = typeof r.title === "string" ? r.title : "";
      const link = typeof r.link === "string" ? r.link : "";
      const snippet = typeof r.snippet === "string" ? r.snippet : "";
      const position =
        typeof r.position === "number" ? r.position : organic.length + 1;
      if (title || link) {
        organic.push({ position, title, link, snippet });
      }
    }
  }

  const relatedSearches: string[] = [];
  const rel = obj.related_searches;
  if (Array.isArray(rel)) {
    for (const item of rel) {
      if (item && typeof item === "object" && "query" in item) {
        const q = (item as { query?: string }).query;
        if (q) relatedSearches.push(q);
      }
    }
  }

  const peopleAlsoAsk: Array<{ question: string; snippet?: string }> = [];
  const paa = obj.related_questions;
  if (Array.isArray(paa)) {
    for (const item of paa) {
      if (!item || typeof item !== "object") continue;
      const q = (item as { question?: string }).question;
      if (q) {
        peopleAlsoAsk.push({
          question: q,
          snippet: (item as { snippet?: string }).snippet,
        });
      }
    }
  }

  return {
    query,
    organic,
    relatedSearches: relatedSearches.length ? relatedSearches : undefined,
    peopleAlsoAsk: peopleAlsoAsk.length ? peopleAlsoAsk : undefined,
  };
}
