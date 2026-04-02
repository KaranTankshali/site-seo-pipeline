export function normalizePageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/$/, "") || "/";
    return `${parsed.origin}${pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

export function siteHostKey(hostname: string): string {
  return hostname.replace(/^www\./i, "").toLowerCase();
}

export function isSameSite(url: string, baseOrigin: string): boolean {
  try {
    const base = new URL(baseOrigin);
    const parsed = new URL(url, baseOrigin);
    return siteHostKey(parsed.hostname) === siteHostKey(base.hostname);
  } catch {
    return false;
  }
}

export function originOnly(input: string): string {
  try {
    const u = new URL(input);
    return `${u.protocol}//${u.host}`;
  } catch {
    return input.replace(/\/$/, "");
  }
}
