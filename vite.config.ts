import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Dev: UI on 5173, /api proxied to Express on 3210. */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3210",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
