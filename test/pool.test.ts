import { describe, expect, it } from "vitest";
import { mapPool } from "../src/pipeline/pool.js";

describe("mapPool", () => {
  it("returns empty array for empty input", async () => {
    expect(await mapPool([], 3, async () => 1)).toEqual([]);
  });

  it("preserves order with concurrency 1", async () => {
    const order: number[] = [];
    const out = await mapPool([1, 2, 3], 1, async (n) => {
      order.push(n);
      return n * 10;
    });
    expect(out).toEqual([10, 20, 30]);
    expect(order).toEqual([1, 2, 3]);
  });

  it("preserves result order with higher concurrency", async () => {
    const out = await mapPool([1, 2, 3, 4], 3, async (n, i) => {
      await new Promise((r) => setTimeout(r, (4 - n) * 5));
      return `${i}:${n}`;
    });
    expect(out).toEqual(["0:1", "1:2", "2:3", "3:4"]);
  });

  it("uses at least one worker when concurrency is 0", async () => {
    const out = await mapPool([5], 0, async (n) => n + 1);
    expect(out).toEqual([6]);
  });
});
