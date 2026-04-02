import { describe, expect, it } from "vitest";
import { parseModelJson } from "../src/suggest/parse-model-json.js";

describe("parseModelJson", () => {
  it("parses raw JSON object", () => {
    expect(parseModelJson('{"a":1}', "x")).toEqual({ a: 1 });
  });

  it("strips markdown json fence", () => {
    const raw = "```json\n{\"b\":2}\n```";
    expect(parseModelJson(raw, "x")).toEqual({ b: 2 });
  });

  it("extracts first object when surrounded by prose", () => {
    const raw = 'Here you go:\n{"c":3}\nThanks.';
    expect(parseModelJson(raw, "x")).toEqual({ c: 3 });
  });

  it("handles nested braces inside strings", () => {
    const raw = '{"msg": "use {curlies}"}';
    expect(parseModelJson(raw, "x")).toEqual({ msg: "use {curlies}" });
  });

  it("throws when no object present", () => {
    expect(() => parseModelJson("no json here", "lbl")).toThrow(
      "lbl: model returned no JSON object"
    );
  });

  it("throws on unbalanced object", () => {
    expect(() => parseModelJson("{ broken", "lbl")).toThrow("lbl: invalid JSON");
  });

  it("throws when outer braces look like JSON but inner parse fails", () => {
    expect(() => parseModelJson('noise { "x": } trailing', "lbl")).toThrow(
      "lbl: invalid JSON"
    );
  });
});
