import { defineConfig, type Plugin } from "vite";
import type { ManifestEntry, ManifestTransform } from "workbox-build";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA, type VitePluginPWAAPI } from "vite-plugin-pwa";
import { resolvePublicSiteOrigin } from "./src/lib/siteOrigin.ts";

const publicSiteOrigin = resolvePublicSiteOrigin(
  {
    VITE_PUBLIC_SITE_URL: process.env.VITE_PUBLIC_SITE_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  },
  { requireHttps: process.env.VERCEL_ENV === "production" },
);
const publicOgImage = `${publicSiteOrigin}/og/dress-note-share.jpg`;
const siteMetadataPlugin: Plugin = {
  name: "dress-note-static-metadata",
  transformIndexHtml(html) {
    return html
      .replaceAll("%PUBLIC_SITE_ORIGIN%", publicSiteOrigin)
      .replaceAll("%PUBLIC_OG_IMAGE%", publicOgImage);
  },
};
const sortPrecacheManifest: ManifestTransform = (entries) => ({
  manifest: [...entries].sort((left, right) =>
    left.url < right.url ? -1 : left.url > right.url ? 1 : 0,
  ),
});
const pwaManifestFilename = "manifest.webmanifest";
const pwaPlugins = VitePWA({
  registerType: "prompt",
  includeManifestIcons: false,
  manifestFilename: pwaManifestFilename,
  manifest: {
    name: "드레스노트 - 드레스투어 기록",
    short_name: "드레스노트",
    description: "사진 대신 모양으로 기록하는 드레스투어 노트",
    theme_color: "#b96e63",
    background_color: "#fff8f5",
    display: "standalone",
    orientation: "portrait",
    start_url: "/",
    scope: "/",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  },
  workbox: {
    clientsClaim: true,
    navigateFallback: "/index.html",
    navigateFallbackDenylist: [/^\/__review(?:\/|$)/],
    globPatterns: ["**/*.{js,css,html,svg,png,jpg,webmanifest,webp,woff2}"],
    manifestTransforms: [sortPrecacheManifest],
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
    cleanupOutdatedCaches: true,
  },
});
const pwaMainPlugin = pwaPlugins[0] as Plugin & { api: VitePluginPWAAPI };
const keepGeneratedManifestInGlobPrecache: Plugin = {
  name: "dress-note-pwa-manifest-precache",
  buildStart() {
    pwaMainPlugin.api.extendManifestEntries(
      (entries: Array<string | ManifestEntry>) =>
        entries.filter((entry: string | ManifestEntry) => {
          const url = typeof entry === "string" ? entry : entry.url;
          return url !== pwaManifestFilename;
        }),
    );
  },
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    siteMetadataPlugin,
    ...pwaPlugins,
    keepGeneratedManifestInGlobPrecache,
  ],
});
