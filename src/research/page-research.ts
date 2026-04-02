import type { PageResearchBundle, PageSnapshot, SiteProfile } from "../types.js";
import { buildResearchQueries } from "./build-queries.js";
import { googleSuggest } from "./google-suggest.js";
import { serpApiGoogleSearch } from "./serpapi.js";

export interface GatherPageResearchOptions {
  site: SiteProfile;
  suggestDelayMs?: number;
  skipSerp?: boolean;
  serpApiKey?: string;
  /** Called before each SerpAPI request; return false to skip (budget) */
  tryConsumeSerpSlot?: () => boolean;
}

function siteHost(siteUrl: string): string {
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return siteUrl;
  }
}

export async function gatherPageResearch(
  snapshot: PageSnapshot,
  options: GatherPageResearchOptions
): Promise<PageResearchBundle> {
  const host = siteHost(options.site.siteUrl);
  const queriesUsed = buildResearchQueries(snapshot, host);
  const googleSuggestSet = new Set<string>();
  const serpByQuery: PageResearchBundle["serpByQuery"] = [];

  const delay = options.suggestDelayMs ?? 400;
  const hl = options.site.locale || "en";
  const gl = options.site.region || "us";

  for (const q of queriesUsed) {
    const sug = await googleSuggest(q, { locale: hl, region: gl });
    sug.forEach((s) => googleSuggestSet.add(s));
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
  }

  const consumeSerp = options.tryConsumeSerpSlot ?? (() => true);

  if (
    !options.skipSerp &&
    options.serpApiKey &&
    queriesUsed[0] &&
    consumeSerp()
  ) {
    try {
      const sr = await serpApiGoogleSearch(queriesUsed[0], {
        apiKey: options.serpApiKey,
        locale: hl,
        region: gl,
      });
      serpByQuery.push(sr);
    } catch {
      /* SERP optional failure — still return Suggest */
    }
  }

  if (
    !options.skipSerp &&
    options.serpApiKey &&
    queriesUsed[1] &&
    consumeSerp()
  ) {
    try {
      const sr = await serpApiGoogleSearch(queriesUsed[1], {
        apiKey: options.serpApiKey,
        locale: hl,
        region: gl,
      });
      serpByQuery.push(sr);
    } catch {
      /* ignore */
    }
  }

  return {
    queriesUsed,
    googleSuggest: [...googleSuggestSet].slice(0, 40),
    serpByQuery,
  };
}
