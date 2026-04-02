export interface GoogleSuggestOptions {
  locale?: string;
  region?: string;
  timeoutMs?: number;
}

/**
 * Google Suggest (Firefox client JSON). No API key.
 */
export async function googleSuggest(
  query: string,
  options?: GoogleSuggestOptions
): Promise<string[]> {
  const hl = options?.locale || "en";
  const gl = options?.region || "us";
  const encoded = encodeURIComponent(query);
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=${encodeURIComponent(hl)}&gl=${encodeURIComponent(gl)}&q=${encoded}`;
  const timeoutMs = options?.timeoutMs ?? 8000;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; site-seo-pipeline/1.0)" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return [];
    const json: unknown = await res.json();
    if (!Array.isArray(json) || !Array.isArray(json[1])) return [];
    return (json[1] as string[]).slice(0, 12);
  } catch {
    return [];
  }
}
