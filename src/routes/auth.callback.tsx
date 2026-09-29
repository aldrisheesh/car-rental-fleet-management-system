import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CircleAlert, LoaderCircle } from "lucide-react";

import { GoogleIcon } from "@/components/site/GoogleIcon";
import {
  clearSupabaseBrowserAuthStorage,
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

type CallbackSearch = { code?: string; next?: string; preview?: string };

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search): CallbackSearch => ({
    code: typeof search.code === "string" ? search.code : undefined,
    next: typeof search.next === "string" ? search.next : undefined,
    preview: typeof search.preview === "string" ? search.preview : undefined,
  }),
  component: OAuthCallbackPage,
});

function OAuthCallbackPage() {
  const { code, next, preview } = Route.useSearch();
  const isSigningPreview = import.meta.env.DEV && preview === "signing";
  const [message, setMessage] = useState("Connecting your Google account…");
  const [hasError, setHasError] = useState(false);
  const hasStarted = useRef(false);
  const retryHref =
    next?.startsWith("/") && !next.startsWith("//")
      ? `/sign-in?returnTo=${encodeURIComponent(next)}`
      : "/sign-in";

  useEffect(() => {
    if (isSigningPreview) return;
    if (hasStarted.current) return;
    hasStarted.current = true;
    let cancelled = false;

    function showError(nextMessage: string) {
      setHasError(true);
      setMessage(nextMessage);
    }

    async function completeSignIn() {
      if (!code) {
        showError("Google did not return a sign-in code. Please try again.");
        return;
      }

      try {
        const client = getSupabaseBrowserClient();
        const result = await client.auth.exchangeCodeForSession(code);
        const session = result.data.session;
        if (result.error || !session) {
          showError("We couldn't complete Google sign-in. Please try again.");
          return;
        }

        const response = await fetch("/api/auth/oauth/session", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            next,
          }),
        });
        const payload = (await response.json().catch(() => null)) as {
          destination?: string;
          message?: string;
        } | null;

        if (cancelled) return;
        if (!response.ok || !payload?.destination) {
          await client.auth.signOut({ scope: "local" });
          showError(
            payload?.message ?? "We couldn't establish your account session.",
          );
          return;
        }

        const sessionResponse = await fetch("/api/auth/session", {
          credentials: "same-origin",
        });
        if (!sessionResponse.ok) {
          await client.auth.signOut({ scope: "local" });
          showError(
            "Your Google sign-in finished, but we couldn't save your app session.",
          );
          return;
        }

        // The browser and httpOnly cookie layers currently refer to the same
        // Supabase session. Calling signOut here revokes the refresh token that
        // the app has just saved, so later route checks appear to log the user
        // out. Stop browser refreshes and discard only the temporary OAuth state;
        // the server cookie remains the canonical app session.
        client.auth.stopAutoRefresh();
        clearSupabaseBrowserAuthStorage();

        window.location.replace(payload.destination);
      } catch {
        if (!cancelled) {
          showError("We couldn't finish Google sign-in. Please try again.");
        }
      }
    }

    void completeSignIn();
    return () => {
      cancelled = true;
    };
  }, [code, isSigningPreview, next]);

  return (
    <main className="oauth-handoff-main">
      <a className="skip-link" href="#oauth-handoff-content">
        Skip to sign-in status
      </a>
      <header className="oauth-handoff-header">
        <a className="oauth-handoff-wordmark" href="/" translate="no">
          <span>Briah&apos;s</span>
          <small>Car Rental</small>
        </a>
      </header>

      <section
        id="oauth-handoff-content"
        className={`oauth-handoff ${hasError ? "is-error" : ""}`}
        aria-labelledby="oauth-handoff-title"
      >
        <div className="oauth-handoff-provider-mark" aria-hidden="true">
          {hasError ? (
            <CircleAlert size={31} strokeWidth={1.8} />
          ) : (
            <GoogleIcon />
          )}
        </div>
        <h1 id="oauth-handoff-title">
          {hasError ? "We couldn’t sign you in" : "Signing you in"}
        </h1>
        <p
          className="oauth-handoff-message"
          role={hasError ? "alert" : "status"}
        >
          {message}
        </p>

        {hasError ? (
          <a className="oauth-handoff-retry" href={retryHref}>
            Try Google sign-in again
          </a>
        ) : (
          <>
            <LoaderCircle
              className="oauth-handoff-spinner"
              size={34}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <p className="oauth-handoff-note">
              This should only take a moment.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
