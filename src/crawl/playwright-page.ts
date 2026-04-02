import type { BrowserContext, Page } from "playwright";
import type { PageSnapshot } from "../types.js";

async function extractInPage(page: Page): Promise<Omit<PageSnapshot, "url" | "fetchedAt" | "mode">> {
  return page.evaluate(() => {
    const getMeta = (name: string): string | null => {
      const meta = document.querySelector(
        `meta[name="${name}"], meta[property="${name}"]`
      );
      return meta?.getAttribute("content")?.trim() || null;
    };
    const headings = (level: number): string[] => {
      return Array.from(document.querySelectorAll(`h${level}`))
        .map((h) => h.textContent?.trim() || "")
        .filter(Boolean);
    };
    const body = document.body?.innerText || "";
    const wordCount = body.split(/\s+/).filter((w) => w.length > 0).length;
    const canonical =
      document.querySelector('link[rel="canonical"]')?.getAttribute("href")?.trim() ||
      null;
    const baseHost = window.location.hostname;
    let internal = 0;
    let external = 0;
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.toLowerCase().startsWith("javascript:"))
        return;
      try {
        const u = new URL(href, window.location.origin);
        if (u.hostname === baseHost) internal++;
        else external++;
      } catch {
        internal++;
      }
    });
    let imagesWithoutAlt = 0;
    document.querySelectorAll("img").forEach((img) => {
      const alt = img.getAttribute("alt");
      if (!alt?.trim()) imagesWithoutAlt++;
    });
    const jsonLdSnippetCount = document.querySelectorAll(
      'script[type="application/ld+json"]'
    ).length;

    return {
      title: document.title || "",
      metaDescription: getMeta("description") || "",
      h1Tags: headings(1),
      h2Tags: headings(2),
      h3Tags: headings(3),
      canonicalUrl: canonical,
      ogTitle: getMeta("og:title"),
      ogDescription: getMeta("og:description"),
      ogImage: getMeta("og:image"),
      wordCount,
      internalLinkCount: internal,
      externalLinkCount: external,
      imagesWithoutAlt,
      jsonLdSnippetCount,
    };
  });
}

export interface PlaywrightSnapshotOptions {
  navigationTimeoutMs?: number;
  postLoadDelayMs?: number;
  blockHeavyResources?: boolean;
}

export async function playwrightPageSnapshot(
  context: BrowserContext,
  url: string,
  options?: PlaywrightSnapshotOptions
): Promise<PageSnapshot> {
  const navigationTimeoutMs = options?.navigationTimeoutMs ?? 45_000;
  const postLoadDelayMs = options?.postLoadDelayMs ?? 0;
  const blockHeavyResources = options?.blockHeavyResources ?? true;

  if (blockHeavyResources) {
    await context.route("**/*", (route) => {
      const t = route.request().resourceType();
      if (t === "image" || t === "media" || t === "font") return route.abort();
      return route.continue();
    });
  }

  const page = await context.newPage();
  try {
    const res = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: navigationTimeoutMs,
    });
    if (postLoadDelayMs > 0) {
      await page.waitForTimeout(postLoadDelayMs);
    }
    const statusCode = res?.status();
    const data = await extractInPage(page);
    return {
      url,
      fetchedAt: new Date().toISOString(),
      mode: "playwright",
      statusCode,
      ...data,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      url,
      fetchedAt: new Date().toISOString(),
      mode: "playwright",
      title: "",
      metaDescription: "",
      h1Tags: [],
      h2Tags: [],
      h3Tags: [],
      canonicalUrl: null,
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      wordCount: 0,
      error: msg,
    };
  } finally {
    await page.close();
  }
}
