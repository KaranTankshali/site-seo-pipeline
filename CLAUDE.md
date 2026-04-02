# Claude Code — site-seo-pipeline

**Read [AGENTS.md](./AGENTS.md) first** for architecture, file map, and conventions.

**Quick reference**

- **Stack:** Node 18+, ESM, TypeScript (`module: NodeNext`), Vitest.
- **Build:** `npm run build` → `dist/`
- **Test:** `npm test`
- **Public API:** `src/index.ts` → published as `site-seo-pipeline`
- **CLI:** `src/cli.ts` — `main()` runs only when the file is the process entrypoint (see `isCliMain`).

When adding features: extend the right layer (`sitemap` / `crawl` / `research` / `suggest` / `pipeline`), export from `index.ts`, document in README, add tests with mocks.
