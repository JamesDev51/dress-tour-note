import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
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

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    siteMetadataPlugin,
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "assets/options/top/strapless.webp",
        "assets/options/top/offShoulder.webp",
        "assets/options/top/strap.webp",
        "assets/options/top/halter.webp",
        "assets/options/top/shortSleeve.webp",
        "assets/options/top/longSleeve.webp",
        "assets/options/neckline/straight.webp",
        "assets/options/neckline/sweetheart.webp",
        "assets/options/neckline/v.webp",
        "assets/options/neckline/square.webp",
        "assets/options/neckline/scoop.webp",
        "assets/options/neckline/asymmetric.webp",
        "assets/options/silhouette/aLine.webp",
        "assets/options/silhouette/ballGown.webp",
        "assets/options/silhouette/mermaid.webp",
        "assets/options/silhouette/empire.webp",
        "assets/options/fabric/mikadoSatin.webp",
        "assets/options/fabric/lace.webp",
        "assets/options/fabric/organzaChiffon.webp",
        "assets/options/fabric/subtleBeaded.webp",
        "assets/options/fabric/ornateBeaded.webp",
        "assets/options/fabric/floral3D.webp",
        "assets/options/color/pureWhite.webp",
        "assets/options/color/ivory.webp",
        "assets/options/color/champagne.webp",
        "og/dress-note-share.jpg",
        "favicon.svg",
        "icons/favicon-32.png",
        "icons/apple-touch-icon.png",
        "icons/icon-192.png",
        "icons/icon-512.png",
      ],
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
        globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
