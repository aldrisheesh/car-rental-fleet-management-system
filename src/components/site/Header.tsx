import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, UserRound, X } from "lucide-react";

import { getClientPrincipal } from "@/lib/auth-client";
import { clearCustomerSession } from "@/lib/customer-auth";
import type { AppPrincipal } from "@/lib/auth";
import { isMyBookingsPath } from "@/lib/customer-navigation";
import { SignInDialog } from "@/components/site/SignInDialog";

export function Header({
  homeMarketing = false,
  hideWordmark = false,
}: {
  homeMarketing?: boolean;
  hideWordmark?: boolean;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [principal, setPrincipal] = useState<AppPrincipal | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const wasOpen = useRef(false);

  useEffect(() => {
    setPrincipal(getClientPrincipal());
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      if (wasOpen.current) {
        requestAnimationFrame(() => menuButtonRef.current?.focus());
      }
      wasOpen.current = false;
      return;
    }

    wasOpen.current = true;
    const firstControl =
      menuPanelRef.current?.querySelector<HTMLElement>("a, button");
    firstControl?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  async function signOut() {
    setSigningOut(true);
    setMenuOpen(false);
    await clearCustomerSession();
    setPrincipal(null);
    setSigningOut(false);
    void navigate({ to: "/", replace: true });
  }

  const isCustomer = principal?.role === "Customer/Renter";
  const isAdmin = principal?.role === "Owner/Admin";
  const isStaff = principal?.role === "Operations Staff";
  const isAdminWorkspace = isAdmin || isStaff;
  const accountLabel = isCustomer
    ? principal.fullName
    : isAdmin
      ? "Admin"
      : isStaff
        ? "Operations Staff"
        : "Sign in";
  const myBookingsActive = isMyBookingsPath(pathname);
  const isAuthenticationPage = pathname === "/sign-in";
  const navigationItems = isCustomer
    ? [{ to: "/customer" as const, label: "My Bookings" }]
    : [];
  const wordmarkDestination = isCustomer ? "/vehicles" : "/";

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className={`customer-header${homeMarketing ? " is-home-marketing" : ""}`}>
        <div
          className={`customer-container customer-header-inner${isCustomer ? " has-customer-journey" : ""}`}
        >
          {!hideWordmark ? (
            <Link
              to={wordmarkDestination}
              className="customer-wordmark"
              translate="no"
            >
              <span>Briah&apos;s</span>
              <small>Car Rental</small>
            </Link>
          ) : null}

          {navigationItems.length ? (
            <nav
              className="customer-desktop-nav"
              aria-label="Customer navigation"
            >
              {navigationItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  activeProps={{ className: "customer-nav-link is-active" }}
                  className={`customer-nav-link${myBookingsActive ? " is-active" : ""}`}
                  aria-current={myBookingsActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}

          {homeMarketing && !principal ? (
            <nav className="customer-desktop-nav customer-marketing-nav" aria-label="Site navigation">
              <a className="customer-nav-link" href="/vehicles">
                Our cars
              </a>
              <a className="customer-nav-link" href="#rental-assurances">
                How it works
              </a>
            </nav>
          ) : null}

          {!isAuthenticationPage ? <div className="customer-header-account">
            {principal ? (
              <>
                <Link
                  to={isAdminWorkspace ? "/admin" : "/customer"}
                  className="customer-account-link"
                >
                  <UserRound size={24} strokeWidth={1.7} aria-hidden="true" />
                  <span>{accountLabel}</span>
                </Link>
                {isCustomer ? (
                  <button
                    type="button"
                    className="customer-sign-out"
                    onClick={() => void signOut()}
                    disabled={signingOut}
                  >
                    <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
                    <span>{signingOut ? "Signing out…" : "Sign out"}</span>
                  </button>
                ) : null}
              </>
            ) : (
              <button
                type="button"
                className="customer-account-link"
                onClick={() => setSignInOpen(true)}
              >
                <UserRound size={24} strokeWidth={1.7} aria-hidden="true" />
                <span>Sign in</span>
              </button>
            )}
          </div> : null}

          <button
            ref={menuButtonRef}
            type="button"
            className="customer-menu-button"
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            aria-controls="customer-mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X size={24} strokeWidth={1.7} />
            ) : (
              <Menu size={24} strokeWidth={1.7} />
            )}
            <span>Menu</span>
          </button>
        </div>

        {menuOpen ? (
          <div
            ref={menuPanelRef}
            id="customer-mobile-nav"
            className="customer-mobile-nav"
          >
            <nav className="customer-container" aria-label="Mobile navigation">
              {navigationItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  activeProps={{ className: "customer-mobile-link is-active" }}
                  className={`customer-mobile-link${myBookingsActive ? " is-active" : ""}`}
                  aria-current={myBookingsActive ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {homeMarketing && !principal ? (
                <>
                  <a className="customer-mobile-link" href="/vehicles" onClick={() => setMenuOpen(false)}>
                    Our cars
                  </a>
                  <a className="customer-mobile-link" href="#rental-assurances" onClick={() => setMenuOpen(false)}>
                    How it works
                  </a>
                </>
              ) : null}
              {principal ? (
                <>
                  {isCustomer ? (
                    <Link
                      to="/customer/profile"
                      className="customer-mobile-link"
                      onClick={() => setMenuOpen(false)}
                    >
                      Edit profile
                    </Link>
                  ) : null}
                  {isAdminWorkspace ? (
                    <Link
                      to="/admin"
                      className="customer-mobile-link"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin workspace
                    </Link>
                  ) : null}
                  {isCustomer ? (
                    <button
                      type="button"
                      className="customer-mobile-sign-out"
                      onClick={() => void signOut()}
                      disabled={signingOut}
                    >
                      {signingOut ? "Signing out…" : "Sign out"}
                    </button>
                  ) : null}
                </>
              ) : !isAuthenticationPage ? (
                <button
                  type="button"
                  className="customer-mobile-sign-in"
                  onClick={() => {
                    setMenuOpen(false);
                    setSignInOpen(true);
                  }}
                >
                  Sign in
                </button>
              ) : null}
            </nav>
          </div>
        ) : null}
      </header>
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  );
}
