import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

function isLoopbackAddress(address: string | undefined) {
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function e2eAdminSignIn(email: string, password: string): Plugin {
  return {
    name: "e2e-admin-sign-in",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/_dev/e2e-admin", async (request, response) => {
        if (request.method !== "GET" || !isLoopbackAddress(request.socket.remoteAddress)) {
          response.statusCode = 404;
          response.end();
          return;
        }
        if (!email || !password) {
          response.statusCode = 503;
          response.end("Developer sign-in is not configured.");
          return;
        }
        try {
          const signInResponse = await fetch(`http://${request.headers.host}/api/auth/sign-in`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          if (!signInResponse.ok) throw new Error("sign-in failed");
          const cookies = signInResponse.headers.getSetCookie();
          if (cookies.length) response.setHeader("Set-Cookie", cookies);
          response.writeHead(302, { Location: "/admin" });
          response.end();
        } catch {
          response.statusCode = 502;
          response.end("Developer sign-in could not be completed.");
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  return {
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    tanstackStart(),
    nitro({ preset: process.env.VERCEL ? "vercel" : "node-server" }),
    react(),
    e2eAdminSignIn(environment.E2E_ADMIN_EMAIL, environment.E2E_ADMIN_PASSWORD),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-start", "@tanstack/react-router"],
  },
  ssr: {
    noExternal: ["lucide-react"],
  },
  };
});
