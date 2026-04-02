import { discoverPageUrlsFromSitemaps } from "../sitemap/discover.js";
import { originOnly } from "../sitemap/url-utils.js";
import { fetchPageSnapshot } from "../crawl/fetch-page.js";
import { gatherPageResearch } from "../research/page-research.js";
import { suggestSeoWithGemini } from "../suggest/gemini.js";
import type { PipelinePageResult, RunPipelineOptions } from "../types.js";
import { mapPool } from "./pool.js";

export async function runPipeline(
  options: RunPipelineOptions & {
    serpApiKey?: string;
    geminiApiKey?: string;
  }
): Promise<PipelinePageResult[]> {
  const baseOrigin = originOnly(options.site.siteUrl);
  const limit = options.limit ?? 100;
  const crawlConcurrency = Math.max(1, options.crawlConcurrency ?? 4);
  const maxSitemapFetches = options.maxSitemapFetches ?? 2000;

  const urls = await discoverPageUrlsFromSitemaps(
    options.seedSitemaps,
    baseOrigin,
    {
      maxFetches: maxSitemapFetches,
      fetchTimeoutMs: options.sitemapFetchTimeoutMs ?? 60_000,
      includeUrl: options.includeSitemapUrl,
    }
  );

  const capped = urls.slice(0, limit);
  let serpRemaining = options.maxSerpCalls ?? 80;

  const tryConsumeSerpSlot = (): boolean => {
    if (serpRemaining <= 0) return false;
    serpRemaining -= 1;
    return true;
  };

  const usePlaywright = options.renderJs === true;

  type PWBrowser = import("playwright").Browser;
  type PWContext = import("playwright").BrowserContext;
  let browser: PWBrowser | null = null;
  let context: PWContext | null = null;
  let playwrightPageSnapshot: typeof import("../crawl/playwright-page.js").playwrightPageSnapshot;

  if (usePlaywright) {
    try {
      const pw = await import("playwright");
      const mod = await import("../crawl/playwright-page.js");
      playwrightPageSnapshot = mod.playwrightPageSnapshot;
      browser = await pw.chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      context = await browser.newContext({
        ignoreHTTPSErrors: true,
        javaScriptEnabled: true,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(
        `renderJs requires an optional dependency: npm install playwright. (${msg})`
      );
    }
  }

  try {
    const results = await mapPool(
      capped,
      crawlConcurrency,
      async (url): Promise<PipelinePageResult> => {
        const errors: string[] = [];

        let snapshot;
        if (usePlaywright && context && playwrightPageSnapshot) {
          snapshot = await playwrightPageSnapshot(context, url, {
            navigationTimeoutMs: options.playwrightNavigationTimeoutMs,
            postLoadDelayMs: options.playwrightPostLoadDelayMs,
            blockHeavyResources: options.blockHeavyResources ?? true,
          });
        } else {
          snapshot = await fetchPageSnapshot(
            url,
            options.playwrightNavigationTimeoutMs ?? 45_000
          );
        }

        if (snapshot.error) errors.push(`crawl: ${snapshot.error}`);

        let research;
        try {
          research = await gatherPageResearch(snapshot, {
            site: options.site,
            suggestDelayMs: options.suggestDelayMs ?? 350,
            skipSerp: options.skipSerp,
            serpApiKey: options.serpApiKey,
            tryConsumeSerpSlot: options.skipSerp
              ? () => false
              : tryConsumeSerpSlot,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`research: ${msg}`);
          research = {
            queriesUsed: [],
            googleSuggest: [],
            serpByQuery: [],
          };
        }

        let suggestion;
        if (!options.skipSuggest && options.geminiApiKey) {
          try {
            suggestion = await suggestSeoWithGemini(
              options.site,
              snapshot,
              research,
              {
                apiKey: options.geminiApiKey,
                model: options.geminiModel,
              }
            );
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            errors.push(`suggest: ${msg}`);
          }
        }

        return {
          url,
          snapshot,
          research,
          suggestion,
          errors,
        };
      }
    );

    return results;
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
  }
}
