# site-seo-pipeline

<p align="center">
  <a href="#installation">Installation</a> ·
  <a href="#quick-start-cli">Quick Start</a> ·
  <a href="#starting-workflows">Starting Workflows</a> ·
  <a href="#api-reference">API Reference</a> ·
  <a href="#configuration">Configuration</a> ·
  <a href="#testing">Testing</a> ·
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/site-seo-pipeline"><img src="https://img.shields.io/npm/v/site-seo-pipeline.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/site-seo-pipeline"><img src="https://img.shields.io/npm/dm/site-seo-pipeline.svg" alt="NPM Downloads" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/site-seo-pipeline.svg" alt="License" /></a>
  <a href="https://github.com/karantankshali/site-seo-pipeline"><img src="https://img.shields.io/github/stars/karantankshali/site-seo-pipeline?style=flat&logo=github" alt="GitHub Stars" /></a>
</p>

<p align="center">
  <a href="https://github.com/karantankshali/site-seo-pipeline/commits"><img src="https://img.shields.io/github/last-commit/karantankshali/site-seo-pipeline?style=flat&logo=github" alt="Last Commit" /></a>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white" alt="Node.js" /></a>
  <img src="https://img.shields.io/badge/ESM-modules-FFCA28?logo=javascript&logoColor=black" alt="ESM" />
</p>

<p align="center">
  <a href="https://bundlephobia.com/package/site-seo-pipeline"><img src="https://img.shields.io/bundlephobia/minzip/site-seo-pipeline?label=bundle%20size" alt="Bundle Size" /></a>
  <a href="https://github.com/karantankshali/site-seo-pipeline/issues"><img src="https://img.shields.io/github/issues/karantankshali/site-seo-pipeline?style=flat&logo=github" alt="Issues" /></a>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
</p>

<!-- If your GitHub repo path differs, update the `karantankshali/site-seo-pipeline` segments in the badge URLs above. -->

Turn your **sitemap** into **SEO recommendations** for each page: crawl the HTML, pull **keyword and SERP context**, then generate **meta title**, **meta description**, and **below-the-fold copy** (plus optional FAQs) with **Google Gemini**.

Runs on **Node.js 18+** (ESM). Works on macOS, Linux, and Windows.

### For contributors & AI coding tools

This repo includes instructions that **Cursor**, **GitHub Copilot**, **Claude Code**, **Windsurf**, and similar tools can use for context:

| File | Purpose |
|------|---------|
| [AGENTS.md](./AGENTS.md) | **Main agent guide** — layout, conventions, where to edit, testing |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | PR checklist and publish notes |
| [CLAUDE.md](./CLAUDE.md) | Short pointer for Claude Code |
| [GEMINI.md](./GEMINI.md) | Short pointer for Gemini / AI Studio workflows |
| [.cursor/rules/site-seo-pipeline.mdc](./.cursor/rules/site-seo-pipeline.mdc) | Cursor project rules |
| [.github/copilot-instructions.md](./.github/copilot-instructions.md) | GitHub Copilot workspace instructions |
| [.windsurf/rules/site-seo-pipeline.md](./.windsurf/rules/site-seo-pipeline.md) | Windsurf rules |
| [.clinerules](./.clinerules) | Cline / compatible agents |

`AGENTS.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `GEMINI.md`, and `.clinerules` are included in the **npm package** (`package.json` `files`) so they also appear under `node_modules/site-seo-pipeline/` for tools that index dependencies.

---

## What it does (in order)

| Step | What happens | Needs an API key? |
|------|----------------|-------------------|
| 1. **Sitemap** | Reads your `sitemap.xml` (including nested sitemap indexes) and lists URLs on your site | No |
| 2. **Crawl** | Fetches each page and reads title, meta description, headings, etc. | No |
| 3. **Research** | **Google Suggest** for related queries; optional **SerpAPI** for real Google results (titles, snippets, related searches, People Also Ask) | Suggest: no · SerpAPI: yes |
| 4. **Suggest** | Sends page + research to **Gemini** and returns structured SEO fields | Yes (`GEMINI_API_KEY`) |

You can **skip paid steps** (`--skip-serp`, `--skip-suggest`) and still get crawl + free Suggest, or crawl-only output.

---

## Installation

```bash
npm install site-seo-pipeline
```

---

## Quick start (CLI)

**1.** Get keys (optional but recommended for full output):

- [Google AI Studio](https://aistudio.google.com/apikey) → `GEMINI_API_KEY`
- [SerpAPI](https://serpapi.com/) → `SERPAPI_API_KEY`

**2.** Run:

```bash
export GEMINI_API_KEY="your-key"
export SERPAPI_API_KEY="your-key"

npx site-seo-pipeline \
  --sitemap https://www.example.com/sitemap.xml \
  --site-url https://www.example.com \
  --brand "Example Inc" \
  --limit 10 \
  --out ./seo-output.json
```

**3.** Open `seo-output.json`. Each entry has:

- `snapshot` — what the crawler saw on the page  
- `research` — Suggest keywords + optional SERP snapshots  
- `suggestion` — Gemini’s `metaTitle`, `metaDescription`, `belowTheFoldMarkdown`, optional `faqs`  
- `errors` — per-page issues (e.g. crawl timeout, API error)  

If you omit `GEMINI_API_KEY`, you’ll see a warning and **no `suggestion`** (everything else can still run). If you omit `SERPAPI_API_KEY`, **SERP snapshots are skipped** but Google Suggest still runs.

---

## Starting workflows

- **CLI:** follow [Quick start (CLI)](#quick-start-cli) — `npx site-seo-pipeline` with `--sitemap`, `--site-url`, and `--brand` (plus keys for full output).
- **Library:** call **`runPipeline`** from `site-seo-pipeline` with `seedSitemaps`, `site`, limits, and optional API keys — see [Use from your own code](#use-from-your-own-code).

---

## When to use Playwright (`--render-js`)

Default crawling uses **plain HTTP + HTML parsing** (fast, no browser). Use this if your pages are **server-rendered** or the important tags are in the first HTML response.

Use **`--render-js`** if the site is a **client-side SPA** and title/description only appear after JavaScript runs:

```bash
npm install playwright
npx playwright install chromium

npx site-seo-pipeline --sitemap https://example.com/sitemap.xml \
  --site-url https://example.com --brand "Example" --render-js
```

---

## CLI reference

### Required (or use env)

| Input | Flag | Env fallback |
|--------|------|----------------|
| Sitemap URL | `--sitemap <url>` | `SEO_SITEMAP_URL` or `SITEMAP_URL` |

### Site / copy context

| Flag | Description | Env fallback |
|------|-------------|--------------|
| `--site-url` | Canonical origin (e.g. `https://www.example.com`) | `SITE_URL`, else derived from sitemap URL |
| `--brand` | Brand name used in prompts | `BRAND_NAME`, else hostname |
| `--locale` | Language hint (`hl`), e.g. `en` | `LOCALE` (default `en`) |
| `--region` | Market (`gl`), e.g. `us`, `in`, `gb` | `REGION` (default `us`) |
| `--industry` | Short description for the model | `INDUSTRY` |
| `--tone` | Voice, e.g. `professional` | `TONE` |
| `--cta` | Primary call-to-action phrase | `PRIMARY_CTA` |

### Run control

| Flag | Default | Description |
|------|---------|-------------|
| `--out <path>` | `./seo-pipeline-output.json` | Where to write JSON |
| `--limit <n>` | `50` | Max URLs to process (after sitemap discovery) |
| `--crawl-concurrency <n>` | `4` | Parallel page fetches |
| `--render-js` | off | Use Playwright instead of HTTP fetch |
| `--skip-serp` | off | Do not call SerpAPI |
| `--skip-suggest` | off | Do not call Gemini |
| `--max-serp-calls <n>` | `80` | Max SerpAPI requests for the **whole** run (each URL may use up to 2 when budget remains) |
| `--gemini-model <id>` | `gemini-2.5-flash` | Override if your key doesn’t support the default (e.g. `gemini-1.5-flash`) |

### Environment variables (summary)

| Variable | Role |
|----------|------|
| `GEMINI_API_KEY` | Gemini suggestions |
| `SERPAPI_API_KEY` | Google SERP via SerpAPI |
| `SITE_URL`, `BRAND_NAME`, `LOCALE`, `REGION`, `INDUSTRY`, `TONE`, `PRIMARY_CTA` | Same as flags above |
| `SEO_SITEMAP_URL` / `SITEMAP_URL` | Sitemap if `--sitemap` omitted |
| `MAX_SERP_CALLS` | Default for `--max-serp-calls` |

The CLI loads a `.env` file from the **current working directory** when you run the binary.

---

## API reference

- **CLI:** all flags and env fallbacks are listed in [CLI reference](#cli-reference) below.
- **Programmatic:** import from `site-seo-pipeline` — see [Use from your own code](#use-from-your-own-code) for `runPipeline` and composed steps. Source exports live in [`src/index.ts`](https://github.com/karantankshali/site-seo-pipeline/blob/main/src/index.ts) (published build: `dist/`).

---

## Configuration

Use **CLI flags** and **environment variables** together (flags win when both are set). The CLI reads a **`.env`** file in the current working directory.

| Area | Where it’s documented |
|------|------------------------|
| Site / brand / locale | [Site / copy context](#site--copy-context) |
| Concurrency, limits, skips | [Run control](#run-control) |
| Env var names | [Environment variables (summary)](#environment-variables-summary) |

---

## Use from your own code

Your project must use **ESM** (`"type": "module"` or `.mjs`) or a bundler that resolves ESM.

### Option A — one call: `runPipeline`

```ts
import { runPipeline } from "site-seo-pipeline";

const results = await runPipeline({
  site: {
    brandName: "Example Inc",
    siteUrl: "https://www.example.com",
    locale: "en",
    region: "us",
    industry: "Event marketplace",
  },
  seedSitemaps: ["https://www.example.com/sitemap.xml"],
  limit: 25,
  crawlConcurrency: 4,
  geminiApiKey: process.env.GEMINI_API_KEY,
  serpApiKey: process.env.SERPAPI_API_KEY,
  // Optional:
  // skipSerp: true,
  // skipSuggest: true,
  // renderJs: true,
  // maxSerpCalls: 40,
  // includeSitemapUrl: (url) => !url.includes("/admin"),
});

for (const row of results) {
  console.log(row.url, row.suggestion?.metaTitle, row.errors);
}
```

Pass **`geminiApiKey` / `serpApiKey`** the same way as env vars in the CLI; if omitted, those steps are skipped (same behavior as missing env).

### Option B — compose steps yourself

Useful if you already have URLs, or you only want crawl/research without Gemini.

```ts
import {
  discoverPageUrlsFromSitemaps,
  originOnly,
  fetchPageSnapshot,
  gatherPageResearch,
  suggestSeoWithGemini,
} from "site-seo-pipeline";

const siteUrl = "https://www.example.com";
const base = originOnly(siteUrl);

const urls = await discoverPageUrlsFromSitemaps(
  [`${base}/sitemap.xml`],
  base,
  { maxFetches: 500 }
);

const snapshot = await fetchPageSnapshot(urls[0]!);

const research = await gatherPageResearch(snapshot, {
  site: {
    brandName: "Example",
    siteUrl,
    locale: "en",
    region: "us",
  },
  serpApiKey: process.env.SERPAPI_API_KEY,
  skipSerp: !process.env.SERPAPI_API_KEY,
  suggestDelayMs: 400,
});

const suggestion = await suggestSeoWithGemini(
  { brandName: "Example", siteUrl },
  snapshot,
  research,
  { apiKey: process.env.GEMINI_API_KEY!, model: "gemini-2.5-flash" }
);
```

Other exports include `playwrightPageSnapshot`, `serpApiGoogleSearch`, `googleSuggest`, `parseModelJson`, and `mapPool` — see `src/index.ts`.

---

## Output shape (JSON)

Each array element is roughly:

```json
{
  "url": "https://www.example.com/page",
  "snapshot": {
    "url": "...",
    "mode": "fetch",
    "title": "...",
    "metaDescription": "...",
    "h1Tags": ["..."],
    "h2Tags": ["..."],
    "wordCount": 0,
    "error": "only if crawl failed"
  },
  "research": {
    "queriesUsed": ["..."],
    "googleSuggest": ["..."],
    "serpByQuery": [
      {
        "query": "...",
        "organic": [{ "position": 1, "title": "...", "link": "...", "snippet": "..." }],
        "relatedSearches": ["..."],
        "peopleAlsoAsk": [{ "question": "...", "snippet": "..." }]
      }
    ]
  },
  "suggestion": {
    "metaTitle": "...",
    "metaDescription": "...",
    "belowTheFoldMarkdown": "## Section\\n...",
    "faqs": [{ "question": "...", "answer": "..." }],
    "serpAngle": "..."
  },
  "errors": []
}
```

`suggestion` may be missing if Gemini was skipped or failed; check `errors` for that page.

---

## Costs and limits (practical notes)

- **Google Suggest** is free but rate-sensitive; the pipeline spaces requests (`suggestDelayMs`, default ~350ms in `runPipeline`).
- **SerpAPI** is billed per search; use `--max-serp-calls` / `maxSerpCalls` to cap spend.
- **Gemini** is billed by your Google AI plan; use `--limit` while testing.

---

## Troubleshooting

| Issue | What to try |
|--------|-------------|
| Empty title / meta on many pages | Use `--render-js` and install Playwright + Chromium |
| No suggestions | Set `GEMINI_API_KEY` or pass `geminiApiKey`; check `errors` for API messages |
| Model not found | `--gemini-model gemini-1.5-flash` (or another model enabled for your key) |
| SerpAPI errors | Check quota and key; use `--skip-serp` to test without SERP |

---

## Testing

```bash
npm test
npm run test:coverage
```

---

## Development

```bash
git clone <your-repo>
cd site-seo-pipeline
npm install
npm run build
npm test
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the PR checklist and publish notes.

---

## License

MIT
