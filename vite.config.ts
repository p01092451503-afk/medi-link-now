import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "FIND-ER - 응급실 실시간 현황",
        short_name: "FIND-ER",
        description: "전국 응급실 실시간 병상 현황 조회 및 사설 구급차 매칭 서비스",
        theme_color: "#C0392B",
        background_color: "#FFFFFF",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        lang: "ko-KR",
        shortcuts: [
          {
            name: "응급실 찾기",
            short_name: "응급실",
            url: "/map",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "SOS 구급차 호출",
            short_name: "SOS",
            url: "/map?sos=true",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "가족 의료 카드",
            short_name: "가족카드",
            url: "/family",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
        ],
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /\/api\/hospital-status/,
            handler: "NetworkFirst",
            options: {
              cacheName: "hospital-status-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxAgeSeconds: 5 * 60,
              },
            },
          },
          {
            urlPattern: /\/rest\/v1\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxAgeSeconds: 5 * 60,
                maxEntries: 50,
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    force: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-map': ['react-kakao-maps-sdk'],
          'vendor-ui': ['framer-motion', 'recharts'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
}));
