import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { PageResearchBundle, PageSnapshot, SeoSuggestion, SiteProfile } from "../types.js";
import { parseModelJson } from "./parse-model-json.js";

const SuggestionSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
  belowTheFoldMarkdown: z.string(),
  faqs: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .optional(),
  serpAngle: z.string().optional(),
});

function summarizeSerp(bundle: PageResearchBundle): string {
  const lines: string[] = [];
  for (const sr of bundle.serpByQuery.slice(0, 2)) {
    lines.push(`Query: ${sr.query}`);
    for (const o of sr.organic.slice(0, 5)) {
      lines.push(`  #${o.position} ${o.title} — ${o.snippet.slice(0, 140)}`);
    }
    if (sr.relatedSearches?.length) {
      lines.push(`  Related: ${sr.relatedSearches.slice(0, 6).join("; ")}`);
    }
    if (sr.peopleAlsoAsk?.length) {
      lines.push(
        `  PAA: ${sr.peopleAlsoAsk
          .slice(0, 4)
          .map((p) => p.question)
          .join(" | ")}`
      );
    }
  }
  return lines.join("\n") || "(no SERP data)";
}

function buildUserPrompt(
  site: SiteProfile,
  snapshot: PageSnapshot,
  bundle: PageResearchBundle
): string {
  const h1 = snapshot.h1Tags.join(" | ") || "(none)";
  const h2sample = snapshot.h2Tags.slice(0, 8).join(" | ") || "(none)";
  const suggest = bundle.googleSuggest.slice(0, 15).join(", ") || "(none)";

  return `Site: ${site.brandName} (${site.siteUrl})
Industry / context: ${site.industry || "general"}
Locale: ${site.locale || "en"}  Region: ${site.region || "us"}
Tone: ${site.tone || "clear, trustworthy, search-intent aligned"}
Primary CTA (if any): ${site.primaryCta || "not specified"}

## Current page
URL: ${snapshot.url}
Title: ${snapshot.title || "(empty)"}
Meta description: ${snapshot.metaDescription || "(empty)"}
H1: ${h1}
Sample H2s: ${h2sample}
Word count (approx): ${snapshot.wordCount}
Mode: ${snapshot.mode}

## Keyword signals (Google Suggest)
${suggest}

## SERP snapshot (competitor titles/snippets — differentiate)
${summarizeSerp(bundle)}

## Task
Return JSON only with:
- metaTitle: ≤60 characters, primary keyword near start, unique vs competitors above, include brand only if it fits naturally
- metaDescription: 150–160 characters, benefit + CTA, align with search intent
- belowTheFoldMarkdown: 2–4 short sections (## headings) with useful copy for humans; incorporate PAA/related themes where relevant; no keyword stuffing
- faqs: optional array of 3 {question, answer} objects, specific to this page topic (not generic)
- serpAngle: one sentence on how this page wins vs typical SERP results

Rules: Do not invent prices, guarantees, or awards. Match the site's actual topic from the URL and headings.`;
}

export interface GeminiSuggestOptions {
  apiKey: string;
  model?: string;
  maxOutputTokens?: number;
}

export async function suggestSeoWithGemini(
  site: SiteProfile,
  snapshot: PageSnapshot,
  bundle: PageResearchBundle,
  options: GeminiSuggestOptions
): Promise<SeoSuggestion> {
  const genAI = new GoogleGenerativeAI(options.apiKey);
  const model = genAI.getGenerativeModel({
    model: options.model ?? "gemini-2.0-flash",
    generationConfig: {
      maxOutputTokens: options.maxOutputTokens ?? 4096,
      temperature: 0.35,
    },
  });

  const prompt = buildUserPrompt(site, snapshot, bundle);
  const result = await model.generateContent(
    `You are a senior SEO strategist. Output a single valid JSON object only, no markdown.\n\n${prompt}`
  );
  const text = result.response.text();
  const parsed = parseModelJson(text, snapshot.url);
  const validated = SuggestionSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Gemini JSON schema mismatch for ${snapshot.url}: ${validated.error.message}`
    );
  }
  const v = validated.data;
  return {
    metaTitle: v.metaTitle.trim(),
    metaDescription: v.metaDescription.trim(),
    belowTheFoldMarkdown: v.belowTheFoldMarkdown.trim(),
    faqs: v.faqs,
    serpAngle: v.serpAngle?.trim(),
  };
}
