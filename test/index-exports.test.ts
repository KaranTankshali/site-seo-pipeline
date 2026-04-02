import { describe, expect, it } from "vitest";
import * as api from "../src/index.js";

describe("package exports", () => {
  it("exposes pipeline and building blocks", () => {
    expect(api.runPipeline).toBeTypeOf("function");
    expect(api.discoverPageUrlsFromSitemaps).toBeTypeOf("function");
    expect(api.fetchPageSnapshot).toBeTypeOf("function");
    expect(api.gatherPageResearch).toBeTypeOf("function");
    expect(api.suggestSeoWithGemini).toBeTypeOf("function");
    expect(api.googleSuggest).toBeTypeOf("function");
    expect(api.serpApiGoogleSearch).toBeTypeOf("function");
    expect(api.parseModelJson).toBeTypeOf("function");
    expect(api.mapPool).toBeTypeOf("function");
    expect(api.originOnly).toBeTypeOf("function");
  });
});
