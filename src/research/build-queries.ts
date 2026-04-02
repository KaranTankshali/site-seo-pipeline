import type { PageSnapshot } from "../types.js";

function slugKeywords(pathname: string): string {
  return pathname
    .split("/")
    .filter(Boolean)
    .map((s) => s.replace(/[-_]+/g, " "))
    .join(" ")
    .trim();
}

/**
 * Derive a small set of search queries from URL + on-page signals.
 */
export function buildResearchQueries(
  snapshot: PageSnapshot,
  siteHost: string
): string[] {
  const queries = new Set<string>();
  try {
    const u = new URL(snapshot.url);
    const pathQ = slugKeywords(u.pathname);
    if (pathQ) queries.add(pathQ);
  } catch {
    /* ignore */
  }

  if (snapshot.title?.trim()) {
    const short = snapshot.title.replace(/\s*[|\u2013\u2014-]\s*.+$/, "").trim();
    if (short.length >= 8) queries.add(short.slice(0, 80));
  }

  if (snapshot.h1Tags[0]?.trim()) {
    queries.add(snapshot.h1Tags[0].trim().slice(0, 80));
  }

  if (queries.size === 0) {
    queries.add(`${siteHost} homepage`);
  }

  return [...queries].slice(0, 4);
}
