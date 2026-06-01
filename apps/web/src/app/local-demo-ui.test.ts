import { describe, expect, it } from "vitest";
import { calcReadinessPercent, escapeSvgText, formatRemainingToday } from "./local-demo-ui";

describe("calcReadinessPercent", () => {
  it("returns 0 when target is zero or negative", () => {
    expect(calcReadinessPercent(3, 0)).toBe(0);
    expect(calcReadinessPercent(3, -1)).toBe(0);
  });

  it("rounds progress and caps at 100", () => {
    expect(calcReadinessPercent(1, 4)).toBe(25);
    expect(calcReadinessPercent(10, 4)).toBe(100);
  });
});

describe("formatRemainingToday", () => {
  it("shows minutes only in the last hour of the day", () => {
    const now = new Date(2026, 5, 1, 23, 45, 0);
    expect(formatRemainingToday(now)).toBe("残り14分");
  });

  it("shows hours and minutes earlier in the day", () => {
    const now = new Date(2026, 5, 1, 10, 20, 0);
    expect(formatRemainingToday(now)).toBe("残り13時間39分");
  });
});

describe("escapeSvgText", () => {
  it("escapes characters that would break SVG text nodes", () => {
    expect(escapeSvgText(`a & b <c> "d" 'e'`)).toBe("a &amp; b &lt;c&gt; &quot;d&quot; &apos;e&apos;");
  });
});
