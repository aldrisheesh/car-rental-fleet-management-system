import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
export const Route = createFileRoute("/auth/confirmed")({
  component: EmailConfirmedPage,
});
function EmailConfirmedPage() {
  const started = useRef(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token"),
      refreshToken = hash.get("refresh_token");
    // Remove confirmation credentials from the address bar before any handoff.
    window.history.replaceState(null, "", window.location.pathname);
    if (!accessToken || !refreshToken || hash.has("error")) {
      setError(true);
      return;
    }
    void fetch("/api/auth/oauth/session", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, refreshToken, next: "/vehicles" }),
    })
      .then(async (response) => {
        const body = await response.json();
        if (
          !response.ok ||
          !body.destination ||
          !body.destination.startsWith("/") ||
          body.destination.startsWith("//")
        )
          throw new Error("session_unavailable");
        window.location.replace(body.destination);
      })
      .catch(() => setError(true));
  }, []);
  return (
    <main className="oauth-handoff-main">
      <section
        className="oauth-handoff"
        aria-labelledby="email-confirmation-heading"
      >
        <h1 id="email-confirmation-heading">
          {error ? "Continue to sign in" : "Finishing email confirmation"}
        </h1>
        <p role={error ? "alert" : "status"}>
          {error
            ? "We couldn't finish setting up your session from this link. Sign in with your email and password, or request a new confirmation link if needed."
            : "Setting up your secure session…"}
        </p>
        {error && (
          <Link to="/sign-in" className="customer-primary-button">
            Sign in
          </Link>
        )}
      </section>
    </main>
  );
}
