import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    ssr: false,  // 👈 disable SSR → static SPA
  },
  vite: {
    optimizeDeps: {
      exclude: ["zod"],
    },
  },
});