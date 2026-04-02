# GitHub Copilot — repository instructions

This repository is **`site-seo-pipeline`**: a Node.js **ESM** TypeScript package that discovers URLs from sitemaps, crawls pages (`fetch` + Cheerio or optional Playwright), runs keyword/SERP research (Google Suggest + optional SerpAPI), and generates SEO suggestions via **Google Gemini**.

## Must read

- **[AGENTS.md](../AGENTS.md)** — directory layout, conventions, where to edit each concern, testing rules.
- **[README.md](../README.md)** — user-facing install, CLI flags, API examples.

## Rules for edits

1. Use **`.js` extensions** in TypeScript relative imports (`from "./x.js"`).
2. Do **not** add static `import "playwright"` in pipeline code; Playwright is loaded with **dynamic `import()`** only when `renderJs` is true.
3. After code changes, run **`npm run build`** and **`npm test`**.
4. New public APIs: export from **`src/index.ts`**, update **README.md**, add **tests** under **`test/`** with mocked `fetch`/APIs.

## Key files

| Area | Path |
|------|------|
| Exports | `src/index.ts` |
| Types | `src/types.ts` |
| CLI | `src/cli.ts` |
| Sitemap | `src/sitemap/` |
| Crawl | `src/crawl/` |
| Research | `src/research/` |
| Gemini | `src/suggest/gemini.ts` |
| Orchestration | `src/pipeline/run.ts` |
