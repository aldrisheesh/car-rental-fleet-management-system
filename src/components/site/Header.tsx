import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, UserRound, X } from "lucide-react";

import { getClientPrincipal } from "@/lib/auth-client";
import { clearCustomerSession } from "@/lib/customer-auth";
import type { AppPrincipal } from "@/lib/auth";

const navItems = [
  { to: "/" as const, label: "Home", exact: true },
  { to: "/vehicles" as const, label: "Find a Car" },
  { to: "/customer" as const, label: "My Bookings" },
  { to: "/contact" as const, label: "Contact" },
];

export function Header() {
  const navigate = useNavigate();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [principal, setPrincipal] = useState<AppPrincipal | null>(null);
  const [signingOut, setSigningOut] = useState(false);
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
  const accountLabel = isCustomer
    ? principal.fullName
    : isAdmin
      ? "Admin"
      : "Sign in";

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="customer-header">
        <div className="customer-container customer-header-inner">
          <Link to="/" className="customer-wordmark" translate="no">
            Briah&apos;s Car Rental
          </Link>

          <nav className="customer-desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                activeOptions={item.exact ? { exact: true } : undefined}
                activeProps={{ className: "customer-nav-link is-active" }}
                className="customer-nav-link"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="customer-header-account">
            {principal ? (
              <>
                <Link
                  to={isAdmin ? "/admin" : "/customer"}
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
              <Link to="/sign-in" className="customer-account-link">
                <UserRound size={24} strokeWidth={1.7} aria-hidden="true" />
                <span>Sign in</span>
              </Link>
            )}
          </div>

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
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  activeOptions={item.exact ? { exact: true } : undefined}
                  activeProps={{ className: "customer-mobile-link is-active" }}
                  className="customer-mobile-link"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
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
                  {isAdmin ? (
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
              ) : (
                <Link
                  to="/sign-in"
                  className="customer-mobile-sign-in"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        ) : null}
      </header>
    </>
  );
}
