import { describe, expect, it } from "vitest";
import { normalizeExternalUrl, resolveSlug } from "./url-utils";

describe("normalizeExternalUrl", () => {
  it("prepends https to bare domains", () => expect(normalizeExternalUrl("example.com")).toBe("https://example.com"));
  it("prepends https to www", () => expect(normalizeExternalUrl("www.example.com/a")).toBe("https://www.example.com/a"));
  it("keeps http", () => expect(normalizeExternalUrl("http://example.com")).toBe("http://example.com"));
  it("keeps empty empty", () => expect(normalizeExternalUrl("  ")).toBe(""));
});

describe("resolveSlug", () => {
  it("derives from title when slug is a URL-ish or empty", () => expect(resolveSlug("", "My Project Title!")).toBe("my-project-title"));
  it("sanitizes typed slug", () => expect(resolveSlug("https://Example.com/x", "T")).toBe("https-example-com-x"));
});
