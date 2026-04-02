#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { runPipeline } from "./pipeline/run.js";
import { originOnly } from "./sitemap/url-utils.js";
import type { SiteProfile } from "./types.js";

export function getArgFromArgv(argv: string[], flag: string): string | null {
  const i = argv.indexOf(flag);
  if (i === -1) return null;
  return argv[i + 1] ?? null;
}

export function hasFlagInArgv(argv: string[], flag: string): boolean {
  return argv.includes(flag);
}

const USAGE_TEXT =
  "Usage: site-seo-pipeline --sitemap https://example.com/sitemap.xml \\\n" +
  "  --site-url https://example.com --brand \"My Site\" [options]\n\n" +
  "Options:\n" +
  "  --out ./output.json\n" +
  "  --limit 50\n" +
  "  --render-js          (requires: npm install playwright)\n" +
  "  --skip-serp\n" +
  "  --skip-suggest\n" +
  "  --max-serp-calls 40\n" +
  "  --crawl-concurrency 4\n" +
  "  --locale en --region us\n" +
  "  --industry \"…\"\n" +
  "  --gemini-model gemini-2.0-flash\n\n" +
  "Env: GEMINI_API_KEY, SERPAPI_API_KEY (https://serpapi.com/)";

export type CliConfigResult =
  | { ok: false; exitCode: number; stderr: string }
  | {
      ok: true;
      site: SiteProfile;
      seedSitemaps: string[];
      limit: number;
      renderJs: boolean;
      skipSerp: boolean;
      skipSuggest: boolean;
      maxSerpCalls: number;
      crawlConcurrency: number;
      geminiModel?: string;
      geminiApiKey?: string;
      serpApiKey?: string;
      outPath: string;
      warnings: string[];
    };

/**
 * Parse argv + env into pipeline options (testable without spawning a process).
 */
export function parseCliConfig(
  argv: string[],
  env: NodeJS.ProcessEnv,
  cwd: string
): CliConfigResult {
  const sitemap =
    getArgFromArgv(argv, "--sitemap") ||
    env.SEO_SITEMAP_URL ||
    env.SITEMAP_URL;
  if (!sitemap) {
    return { ok: false, exitCode: 1, stderr: USAGE_TEXT };
  }

  const siteUrl =
    getArgFromArgv(argv, "--site-url") || env.SITE_URL || originOnly(sitemap);
  let brandName: string;
  try {
    brandName =
      getArgFromArgv(argv, "--brand") ||
      env.BRAND_NAME ||
      new URL(siteUrl).hostname;
  } catch {
    return {
      ok: false,
      exitCode: 1,
      stderr: `Invalid --site-url or sitemap origin: ${siteUrl}`,
    };
  }

  const site: SiteProfile = {
    brandName,
    siteUrl,
    locale: getArgFromArgv(argv, "--locale") || env.LOCALE || "en",
    region: getArgFromArgv(argv, "--region") || env.REGION || "us",
    industry: getArgFromArgv(argv, "--industry") || env.INDUSTRY || undefined,
    tone: getArgFromArgv(argv, "--tone") || env.TONE || undefined,
    primaryCta: getArgFromArgv(argv, "--cta") || env.PRIMARY_CTA || undefined,
  };

  const geminiApiKey = env.GEMINI_API_KEY;
  const serpApiKey = env.SERPAPI_API_KEY;
  const warnings: string[] = [];

  if (!hasFlagInArgv(argv, "--skip-suggest") && !geminiApiKey) {
    warnings.push(
      "Warning: GEMINI_API_KEY not set — suggestions will be skipped (use --skip-suggest to silence)."
    );
  }
  if (!hasFlagInArgv(argv, "--skip-serp") && !serpApiKey) {
    warnings.push(
      "Warning: SERPAPI_API_KEY not set — SerpAPI SERP snapshots will be skipped (Suggest still runs)."
    );
  }

  const outPath =
    getArgFromArgv(argv, "--out") || path.join(cwd, "seo-pipeline-output.json");

  return {
    ok: true,
    site,
    seedSitemaps: [sitemap],
    limit: parseInt(getArgFromArgv(argv, "--limit") || "50", 10),
    renderJs: hasFlagInArgv(argv, "--render-js"),
    skipSerp: hasFlagInArgv(argv, "--skip-serp"),
    skipSuggest: hasFlagInArgv(argv, "--skip-suggest"),
    maxSerpCalls: parseInt(
      getArgFromArgv(argv, "--max-serp-calls") || env.MAX_SERP_CALLS || "80",
      10
    ),
    crawlConcurrency: parseInt(
      getArgFromArgv(argv, "--crawl-concurrency") || "4",
      10
    ),
    geminiModel: getArgFromArgv(argv, "--gemini-model") || undefined,
    geminiApiKey,
    serpApiKey,
    outPath,
    warnings,
  };
}

async function main(): Promise<void> {
  await dotenv.config({ path: path.join(process.cwd(), ".env") });

  const config = parseCliConfig(process.argv, process.env, process.cwd());
  if (!config.ok) {
    console.error(config.stderr);
    process.exit(config.exitCode);
  }

  for (const w of config.warnings) {
    console.warn(w);
  }

  console.error(`Sitemap: ${config.seedSitemaps[0]}`);
  console.error(`Site: ${config.site.siteUrl} (${config.site.brandName})`);

  const results = await runPipeline({
    site: config.site,
    seedSitemaps: config.seedSitemaps,
    limit: config.limit,
    renderJs: config.renderJs,
    skipSerp: config.skipSerp,
    skipSuggest: config.skipSuggest,
    maxSerpCalls: config.maxSerpCalls,
    crawlConcurrency: config.crawlConcurrency,
    geminiModel: config.geminiModel,
    geminiApiKey: config.geminiApiKey,
    serpApiKey: config.serpApiKey,
  });

  await fs.writeFile(
    config.outPath,
    JSON.stringify(results, null, 2),
    "utf8"
  );
  console.error(`Wrote ${results.length} page(s) → ${config.outPath}`);
}

const isCliMain =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]!);

if (isCliMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
