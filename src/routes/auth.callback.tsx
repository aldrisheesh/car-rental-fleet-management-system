import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type CallbackSearch = { code?: string; next?: string };

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search): CallbackSearch => ({
    code: typeof search.code === "string" ? search.code : undefined,
    next: typeof search.next === "string" ? search.next : undefined,
  }),
  component: OAuthCallbackPage,
});

function OAuthCallbackPage() {
  const { code, next } = Route.useSearch();
  const [message, setMessage] = useState("Completing Google sign-in…");
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    let cancelled = false;

    async function completeSignIn() {
      if (!code) {
        setMessage("Google sign-in did not return an authorization code.");
        return;
      }

      const client = getSupabaseBrowserClient();
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      if (error || !data.session) {
        setMessage("Unable to complete Google sign-in. Please try again.");
        return;
      }

      const response = await fetch("/api/auth/oauth/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          next,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        destination?: string;
        message?: string;
      } | null;

      await client.auth.signOut({ scope: "local" });
      if (cancelled) return;
      if (!response.ok || !payload?.destination) {
        setMessage(
          payload?.message ?? "Unable to establish your account session.",
        );
        return;
      }

      window.location.replace(payload.destination);
    }

    void completeSignIn();
    return () => {
      cancelled = true;
    };
  }, [code, next]);

  return (
    <main className="auth-main" aria-live="polite">
      <section className="auth-panel">
        <h1>Signing you in</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}
