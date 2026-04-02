import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateContent } = vi.hoisted(() => ({
  generateContent: vi.fn(),
}));

vi.mock("@google/generative-ai", () => {
  class GoogleGenerativeAIMock {
    getGenerativeModel() {
      return { generateContent };
    }
  }
  return { GoogleGenerativeAI: GoogleGenerativeAIMock };
});

import { suggestSeoWithGemini } from "../src/suggest/gemini.js";
import type { PageResearchBundle, PageSnapshot, SiteProfile } from "../src/types.js";

const site: SiteProfile = { brandName: "B", siteUrl: "https://b.com" };
const snapshot: PageSnapshot = {
  url: "https://b.com/p",
  fetchedAt: new Date().toISOString(),
  mode: "fetch",
  title: "T",
  metaDescription: "",
  h1Tags: ["H"],
  h2Tags: [],
  h3Tags: [],
  canonicalUrl: null,
  ogTitle: null,
  ogDescription: null,
  ogImage: null,
  wordCount: 10,
};

const bundle: PageResearchBundle = {
  queriesUsed: ["q"],
  googleSuggest: ["a", "b"],
  serpByQuery: [
    {
      query: "q",
      organic: [
        {
          position: 1,
          title: "Comp",
          link: "https://c.com",
          snippet: "snippet text here",
        },
      ],
      relatedSearches: ["near me"],
      peopleAlsoAsk: [{ question: "Cost?" }],
    },
  ],
};

function validSuggestion() {
  return {
    metaTitle: "Title under sixty chars for SEO pipeline test case",
    metaDescription:
      "This is a meta description that is long enough for the test case to pass validation rules and sit in the one fifty to one sixty character range comfortably here.",
    belowTheFoldMarkdown: "## Intro\n\nBody.",
    faqs: [{ question: "Q?", answer: "A." }],
    serpAngle: "Differentiates on depth.",
  };
}

describe("suggestSeoWithGemini", () => {
  beforeEach(() => {
    generateContent.mockReset();
  });

  it("returns trimmed suggestion when model returns valid JSON", async () => {
    generateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(validSuggestion()),
      },
    });
    const out = await suggestSeoWithGemini(site, snapshot, bundle, {
      apiKey: "k",
      model: "gemini-test",
    });
    expect(out.metaTitle).toContain("Title");
    expect(out.belowTheFoldMarkdown).toContain("Intro");
    expect(out.faqs?.length).toBe(1);
    expect(out.serpAngle).toBeDefined();
  });

  it("builds prompt when SERP bundle is empty (summarizeSerp fallback)", async () => {
    generateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(validSuggestion()),
      },
    });
    const emptySerpBundle: PageResearchBundle = {
      queriesUsed: [],
      googleSuggest: ["only suggest"],
      serpByQuery: [],
    };
    await suggestSeoWithGemini(site, snapshot, emptySerpBundle, {
      apiKey: "k",
    });
    expect(generateContent).toHaveBeenCalled();
    const prompt = generateContent.mock.calls[0][0] as string;
    expect(prompt).toContain("(no SERP data)");
  });

  it("throws on schema mismatch", async () => {
    generateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({ metaTitle: "only title" }),
      },
    });
    await expect(
      suggestSeoWithGemini(site, snapshot, bundle, { apiKey: "k" })
    ).rejects.toThrow("schema mismatch");
  });
});
