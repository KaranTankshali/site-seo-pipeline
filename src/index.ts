export type {
  DiscoverOptions,
  PageResearchBundle,
  PageSnapshot,
  PipelinePageResult,
  RunPipelineOptions,
  SeoSuggestion,
  SerpOrganicResult,
  SerpResearch,
  SiteProfile,
} from "./types.js";

export { discoverPageUrlsFromSitemaps } from "./sitemap/discover.js";
export {
  extractLocsFromSitemapXml,
  fetchTextWithTimeout,
  isSitemapIndexXml,
} from "./sitemap/discover.js";
export {
  isSameSite,
  normalizePageUrl,
  originOnly,
} from "./sitemap/url-utils.js";

export { fetchPageSnapshot } from "./crawl/fetch-page.js";
export { pageSnapshotFromHtml } from "./crawl/extract-from-html.js";
export { playwrightPageSnapshot } from "./crawl/playwright-page.js";
export type { PlaywrightSnapshotOptions } from "./crawl/playwright-page.js";

export { googleSuggest } from "./research/google-suggest.js";
export { buildResearchQueries } from "./research/build-queries.js";
export { serpApiGoogleSearch } from "./research/serpapi.js";
export type { SerpApiSearchOptions } from "./research/serpapi.js";
export { gatherPageResearch } from "./research/page-research.js";

export { suggestSeoWithGemini } from "./suggest/gemini.js";
export type { GeminiSuggestOptions } from "./suggest/gemini.js";
export { parseModelJson } from "./suggest/parse-model-json.js";

export { runPipeline } from "./pipeline/run.js";
export { mapPool } from "./pipeline/pool.js";
