import { afterEach, describe, expect, it, vi } from "vitest";
import { googleSuggest } from "../src/research/google-suggest.js";

describe("googleSuggest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns second array element from Firefox JSON shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(["q", ["a", "b", "c"], [], []]),
      })
    );
    const out = await googleSuggest("test query", { timeoutMs: 5000 });
    expect(out).toEqual(["a", "b", "c"]);
  });

  it("caps at 12 suggestions", async () => {
    const many = Array.from({ length: 20 }, (_, i) => `s${i}`);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(["q", many, [], []]),
      })
    );
    const out = await googleSuggest("x");
    expect(out.length).toBe(12);
  });

  it("returns empty on non-OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve([]) })
    );
    expect(await googleSuggest("x")).toEqual([]);
  });

  it("returns empty on malformed JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ not: "array" }),
      })
    );
    expect(await googleSuggest("x")).toEqual([]);
  });

  it("returns empty on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fail")));
    expect(await googleSuggest("x")).toEqual([]);
  });

  it("uses hl and gl in URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(["q", [], [], []]),
    });
    vi.stubGlobal("fetch", fetchMock);
    await googleSuggest("hello", { locale: "fr", region: "ca" });
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("hl=fr");
    expect(url).toContain("gl=ca");
    expect(url).toContain(encodeURIComponent("hello"));
  });
});
