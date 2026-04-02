import { describe, expect, it } from "vitest";
import {
  isSameSite,
  normalizePageUrl,
  originOnly,
  siteHostKey,
} from "../src/sitemap/url-utils.js";

describe("normalizePageUrl", () => {
  it("strips trailing slash on path", () => {
    expect(normalizePageUrl("https://ex.com/foo/")).toBe("https://ex.com/foo");
  });

  it("keeps root as /", () => {
    expect(normalizePageUrl("https://ex.com/")).toBe("https://ex.com/");
  });

  it("preserves query string", () => {
    expect(normalizePageUrl("https://ex.com/a/?x=1")).toBe(
      "https://ex.com/a?x=1"
    );
  });

  it("returns original string on invalid URL", () => {
    expect(normalizePageUrl("not-a-url")).toBe("not-a-url");
  });
});

describe("siteHostKey", () => {
  it("normalizes www", () => {
    expect(siteHostKey("WWW.Example.COM")).toBe("example.com");
  });
});

describe("isSameSite", () => {
  it("treats www and apex as same", () => {
    expect(
      isSameSite("https://www.example.com/a", "https://example.com")
    ).toBe(true);
  });

  it("returns false for different hosts", () => {
    expect(isSameSite("https://evil.com", "https://example.com")).toBe(false);
  });

  it("returns false on invalid base", () => {
    expect(isSameSite("https://a.com", "not-url")).toBe(false);
  });
});

describe("originOnly", () => {
  it("returns protocol and host", () => {
    expect(originOnly("https://ex.com/path?q=1")).toBe("https://ex.com");
  });

  it("falls back to trimming slash on invalid", () => {
    expect(originOnly("badhost")).toBe("badhost");
  });
});
