import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPageSnapshot } from "../src/crawl/fetch-page.js";

describe("fetchPageSnapshot", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps successful response to snapshot", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            "<html><head><title>OK</title><meta name=\"description\" content=\"d\" /></head><body><h1>H</h1></body></html>"
          ),
      })
    );
    const s = await fetchPageSnapshot("https://ex.com/x", 5000);
    expect(s.title).toBe("OK");
    expect(s.error).toBeUndefined();
    expect(s.statusCode).toBe(200);
  });

  it("returns error field on fetch failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    const s = await fetchPageSnapshot("https://ex.com/x", 5000);
    expect(s.title).toBe("");
    expect(s.error).toContain("boom");
  });
});
