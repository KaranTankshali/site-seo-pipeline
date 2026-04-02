# AGENTS.md — site-seo-pipeline

Instructions for **AI coding agents** and humans maintaining this package. End users should start with **README.md**.

## What this package is

A **Node.js library + CLI** that:

1. Discovers URLs from **sitemap XML** (index + nested urlsets, same-origin filter).
2. **Crawls** each URL via `fetch` + Cheerio (default) or optional **Playwright** (JS-rendered sites).
3. **Researches** keywords with **Google Suggest** (no key) and optional **SerpAPI** (Google SERP JSON).
4. **Suggests** SEO copy with **Google Gemini** (`metaTitle`, `metaDescription`, `belowTheFoldMarkdown`, optional FAQs).

Published entry: **`dist/`** (build output). Source of truth: **`src/`**.

## Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run build` | `tsc` → `dist/` (required before publish; `prepublishOnly` runs this) |
| `npm test` | Vitest unit tests (mocked network / APIs) |
| `npm run test:coverage` | Coverage report |
| `npm run test:watch` | Watch mode |
| `node dist/cli.js --sitemap …` | Run CLI locally after build |

## Repository layout

```
src/
  index.ts          # Public exports only — add new exports here
  types.ts          # Shared TypeScript interfaces
  cli.ts            # CLI entry; parseCliConfig() is tested; main() gated by isCliMain
  sitemap/          # discover.ts, url-utils.ts — XML fetch + URL collection
  crawl/            # fetch-page.ts, extract-from-html.ts, playwright-page.ts
  research/         # google-suggest.ts, serpapi.ts, build-queries.ts, page-research.ts
  suggest/          # gemini.ts, parse-model-json.ts
  pipeline/         # run.ts (orchestration), pool.ts (concurrency)
test/               # Vitest specs; mock fetch, SerpAPI, Gemini, Playwright
vitest.config.ts
tsconfig.json
```

## Conventions (do not break)

- **ESM only**: `"type": "module"`, Node **18+**.
- **TypeScript imports** use **`.js` extensions** in import paths (NodeNext resolution), e.g. `from "./foo.js"`.
- **Playwright** is an **optional peer** — do not add a top-level `import "playwright"` in `run.ts`; use **dynamic `import()`** inside the `renderJs` branch so the package works without Playwright installed.
- **External I/O**: `fetch` for HTTP; no hardcoded secrets — keys via **env** or **options** (`geminiApiKey`, `serpApiKey`).
- **CLI**: Importing `cli.ts` from tests must **not** auto-run `main()` — entry is guarded by `isCliMain` (`import.meta.url` vs `process.argv[1]`).

## Public API contract

- **Stable surface** is whatever **`src/index.ts` exports**. Changing names or shapes is a **semver** concern (this package is `0.x` — breaking changes are allowed but should be intentional).
- **Types** for consumers: **`dist/*.d.ts`** (generated). Prefer updating **`src/types.ts`** and re-exporting from `index.ts`.
- **Binary**: `package.json` → `"bin": { "site-seo-pipeline": "./dist/cli.js" }`.

## Where to change behavior

| Goal | Likely files |
|------|----------------|
| Sitemap parsing / limits | `src/sitemap/discover.ts` |
| HTML extraction (static crawl) | `src/crawl/extract-from-html.ts` |
| Playwright crawl | `src/crawl/playwright-page.ts` |
| New SERP provider | Add module under `src/research/`, wire in `page-research.ts` or options |
| Prompt / JSON shape for SEO output | `src/suggest/gemini.ts` (+ Zod schema) |
| End-to-end orchestration | `src/pipeline/run.ts` |
| New CLI flags | `src/cli.ts` (`parseCliConfig` + `main` pipeline args) |
| New exports | `src/index.ts` + README |

## Testing expectations

- Add or update tests in **`test/`** for any non-trivial change.
- Mock **`fetch`**, **SerpAPI**, **Gemini**, **Playwright** — tests must not require real API keys or browsers by default.
- Run **`npm test`** before finishing a task.

## README and docs

- User-facing usage: **README.md** (keep in sync when adding flags or exports).
- Maintainer / agent context: **this file**, **CONTRIBUTING.md**, **.github/copilot-instructions.md**, **.cursor/rules/**, **CLAUDE.md**.

## License

MIT — see **LICENSE**.
