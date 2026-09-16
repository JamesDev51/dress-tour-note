const LOCAL_SITE_ORIGIN = "http://127.0.0.1:4173";

export type SiteOriginEnvironment = Readonly<{
  VITE_PUBLIC_SITE_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
}>;

export type SiteOriginOptions = Readonly<{
  requireHttps?: boolean;
  fallback?: string;
}>;

export class SiteOriginError extends Error {
  readonly name = "SiteOriginError";

  constructor(value?: string) {
    super(`공개 사이트 주소를 확인할 수 없어요: ${value || "설정 없음"}`);
  }
}

function candidateFrom(environment: SiteOriginEnvironment) {
  const explicit = environment.VITE_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit;
  return environment.VERCEL_PROJECT_PRODUCTION_URL?.trim();
}

function normalizeOrigin(value: string) {
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(value)
    ? value
    : `https://${value}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch (error) {
    throw new SiteOriginError(value);
  }
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new SiteOriginError(value);
  return url.origin;
}

export function resolvePublicSiteOrigin(
  environment: SiteOriginEnvironment,
  options: SiteOriginOptions = {},
) {
  const candidate = candidateFrom(environment);
  if (!candidate) {
    if (options.requireHttps) throw new SiteOriginError();
    return options.fallback ?? LOCAL_SITE_ORIGIN;
  }
  const origin = normalizeOrigin(candidate);
  if (options.requireHttps && !origin.startsWith("https://"))
    throw new SiteOriginError(candidate);
  return origin;
}
