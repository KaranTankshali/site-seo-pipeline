# Contributing to site-seo-pipeline

Thanks for helping improve this package.

## Setup

```bash
git clone <repo-url>
cd site-seo-pipeline
npm install
npm run build
npm test
```

## Before you open a PR

1. **`npm run build`** — TypeScript compiles cleanly.
2. **`npm test`** — all Vitest tests pass.
3. If you change the **CLI**, **public API**, or **env vars**, update **README.md**.
4. If you change architecture or agent-facing behavior, update **AGENTS.md** (and tool instruction files if needed).

## Code style

- TypeScript **strict** mode; match existing patterns in `src/`.
- Use **`.js` suffixes** in relative imports inside `src/` (NodeNext).
- Prefer **small, focused** changes; avoid unrelated refactors.

## Publishing (maintainers)

```bash
npm run build
npm test
npm publish --access public   # or scoped: @org/pkg
```

Set **`repository`**, **`bugs`**, and **`homepage`** in `package.json` to your real URLs before publishing.

## Questions

Open an issue on the project tracker (link in `package.json` once configured).
