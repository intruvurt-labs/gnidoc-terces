import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const isProd = process.env.NODE_ENV === "production";
const isNetlify = !!process.env.NETLIFY; // set by Netlify CI

export default defineConfig({
  // Your app’s source lives in /client
  root: path.resolve(import.meta.dirname, "client"),

  plugins: [
    react(),
    // Replit-only plugin (don’t load in production/Netlify)
    ...(!isProd && !isNetlify && process.env.REPL_ID
      ? [
          // Top-level await is allowed in Vite config
          await import("@replit/vite-plugin-cartographer").then(m => m.cartographer()),
        ]
      : []),
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  // Build to client/dist so Netlify can publish it
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },

  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
