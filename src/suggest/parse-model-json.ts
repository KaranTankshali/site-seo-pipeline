/**
 * Strip markdown fences; extract first top-level JSON object (tolerant of trailing chatter).
 */
export function parseModelJson(raw: string, labelForError: string): unknown {
  let s = (raw ?? "").trim();
  s = s
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const tryParse = (str: string): unknown => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  let parsed = tryParse(s);
  if (parsed !== null) return parsed;

  const start = s.indexOf("{");
  if (start === -1) {
    throw new Error(`${labelForError}: model returned no JSON object`);
  }

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') inString = false;
    } else {
      if (c === '"') inString = true;
      else if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          parsed = tryParse(s.slice(start, i + 1));
          if (parsed !== null) return parsed;
          break;
        }
      }
    }
  }

  throw new Error(
    `${labelForError}: invalid JSON (try increasing maxOutputTokens). Preview: ${s.slice(0, 200)}`
  );
}
