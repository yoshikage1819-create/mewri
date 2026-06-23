import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const LOGO_PATH = resolve(process.cwd(), "apps/web/public/brand/7bam-logo.svg");

function readLogo(): string {
  return readFileSync(LOGO_PATH, "utf8");
}

describe("7bam logo SVG", () => {
  const svg = readLogo();

  it("exists and is a root svg document", () => {
    expect(svg.length).toBeGreaterThan(0);
    expect(svg).toMatch(/<svg[\s>]/);
    expect(svg).toMatch(/<\/svg>/);
  });

  it("has a tight viewBox and accessibility title", () => {
    expect(svg).toMatch(/viewBox="0 0 94 40"/);
    expect(svg).toMatch(/<title>7bam<\/title>/);
    expect(svg).toMatch(/role="img"/);
  });

  it("uses vector paths with brand fill only", () => {
    expect(svg.match(/<path\b/g)?.length).toBe(4);
    expect(svg).toMatch(/fill="#111111"/);
    expect(svg).not.toMatch(/<text\b/);
    expect(svg).not.toMatch(/<image\b/);
    expect(svg).not.toMatch(/<script\b/);
    expect(svg).not.toMatch(/<foreignObject\b/);
    expect(svg).not.toMatch(/xlink:href|href="http/);
  });

  it("does not spell 7bum", () => {
    expect(svg.toLowerCase()).not.toContain("7bum");
    expect(svg).toContain("7bam");
  });
});
