import { describe, expect, it } from "vitest";
import { resolvePublicSiteOrigin, SiteOriginError } from "./siteOrigin";

describe("resolvePublicSiteOrigin", () => {
  it("prefers an explicit HTTPS site URL and normalizes the trailing slash", () => {
    expect(
      resolvePublicSiteOrigin(
        {
          VITE_PUBLIC_SITE_URL: " https://explicit.example/ ",
          VERCEL_PROJECT_PRODUCTION_URL: "fallback.example",
        },
        { requireHttps: true },
      ),
    ).toBe("https://explicit.example");
  });

  it("normalizes a scheme-less Vercel production URL to HTTPS", () => {
    expect(
      resolvePublicSiteOrigin(
        { VERCEL_PROJECT_PRODUCTION_URL: "dress-note.example/" },
        { requireHttps: true },
      ),
    ).toBe("https://dress-note.example");
  });

  it.each([
    { VITE_PUBLIC_SITE_URL: "http://dress-note.example" },
    { VITE_PUBLIC_SITE_URL: "   " },
    { VERCEL_PROJECT_PRODUCTION_URL: "" },
    { VERCEL_PROJECT_PRODUCTION_URL: "https://dress-note.example/path" },
  ])("rejects an invalid production origin %#", (environment) => {
    expect(() =>
      resolvePublicSiteOrigin(environment, { requireHttps: true }),
    ).toThrow(SiteOriginError);
  });

  it("uses the local preview origin only when HTTPS is not required", () => {
    expect(resolvePublicSiteOrigin({})).toBe("http://127.0.0.1:4173");
    expect(() => resolvePublicSiteOrigin({}, { requireHttps: true })).toThrow(
      SiteOriginError,
    );
  });
});
