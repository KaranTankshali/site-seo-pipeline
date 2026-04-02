/**
 * Site / brand context passed into research and suggestion steps.
 */
export interface SiteProfile {
  /** Display name for copy (e.g. "Acme Events") */
  brandName: string;
  /** Canonical site origin, e.g. https://www.example.com */
  siteUrl: string;
  /** BCP-47 or short code, e.g. "en" */
  locale?: string;
  /** Google `gl` / market, e.g. "us", "in", "gb" */
  region?: string;
  /** Short vertical description for the model */
  industry?: string;
  /** e.g. "professional", "friendly", "minimal" */
  tone?: string;
  /** Primary CTA phrase if any */
  primaryCta?: string;
}

export interface DiscoverOptions {
  /** One or more sitemap index or urlset URLs */
  seedSitemaps: string[];
  /** Normalize host comparison (www vs apex) against this origin */
  baseOrigin: string;
  maxSitemapFetches?: number;
  fetchTimeoutMs?: number;
  /** Return false to drop a page URL after sitemap resolution */
  includeUrl?: (url: string) => boolean;
}

export interface PageSnapshot {
  url: string;
  fetchedAt: string;
  mode: "fetch" | "playwright";
  statusCode?: number;
  title: string;
  metaDescription: string;
  h1Tags: string[];
  h2Tags: string[];
  h3Tags: string[];
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  wordCount: number;
  internalLinkCount?: number;
  externalLinkCount?: number;
  imagesWithoutAlt?: number;
  jsonLdSnippetCount?: number;
  error?: string;
}

export interface SerpOrganicResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
}

export interface SerpResearch {
  query: string;
  organic: SerpOrganicResult[];
  relatedSearches?: string[];
  peopleAlsoAsk?: Array<{ question: string; snippet?: string }>;
}

export interface PageResearchBundle {
  queriesUsed: string[];
  googleSuggest: string[];
  serpByQuery: SerpResearch[];
}

export interface SeoSuggestion {
  metaTitle: string;
  metaDescription: string;
  /** Markdown for below-the-fold / body SEO block */
  belowTheFoldMarkdown: string;
  /** Optional FAQs for structured data or accordions */
  faqs?: Array<{ question: string; answer: string }>;
  /** Short note on SERP differentiation */
  serpAngle?: string;
}

export interface PipelinePageResult {
  url: string;
  snapshot: PageSnapshot;
  research: PageResearchBundle;
  suggestion?: SeoSuggestion;
  errors: string[];
}

export interface RunPipelineOptions {
  site: SiteProfile;
  seedSitemaps: string[];
  /** Max URLs from sitemap to process */
  limit?: number;
  crawlConcurrency?: number;
  /** Use Playwright instead of HTTP fetch (needs `playwright` installed) */
  renderJs?: boolean;
  playwrightNavigationTimeoutMs?: number;
  playwrightPostLoadDelayMs?: number;
  blockHeavyResources?: boolean;
  maxSitemapFetches?: number;
  sitemapFetchTimeoutMs?: number;
  includeSitemapUrl?: (url: string) => boolean;
  /** Skip SerpAPI calls (Suggest only) */
  skipSerp?: boolean;
  /** Max SerpAPI calls total (spread across pages) */
  maxSerpCalls?: number;
  /** Skip Gemini suggestions */
  skipSuggest?: boolean;
  geminiModel?: string;
  /** Google Suggest delay between requests (ms) */
  suggestDelayMs?: number;
}
