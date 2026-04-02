# Windsurf — site-seo-pipeline

This project is an **npm package**: sitemap-driven SEO pipeline (crawl → Google Suggest + optional SerpAPI → optional Gemini).

## Read first

- **AGENTS.md** — architecture, commands, conventions, file map.
- **README.md** — usage for humans.

## Conventions

- ESM + TypeScript; imports like `from "./module.js"` under `src/`.
- Playwright only via **dynamic import** in `pipeline/run.ts` when `renderJs` is true.
- After edits: `npm run build` && `npm test`.

## Entry points

- Library: `src/index.ts` → `dist/`
- CLI: `src/cli.ts` → `dist/cli.js`
