import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    tanstackStart(),
    nitro({ preset: process.env.VERCEL ? "vercel" : "node-server" }),
    react(),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-start", "@tanstack/react-router"],
  },
  ssr: {
    noExternal: ["lucide-react"],
  },
});
