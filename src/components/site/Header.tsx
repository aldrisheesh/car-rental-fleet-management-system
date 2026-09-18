import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";

import { getClientPrincipal } from "@/lib/auth-client";
import { ADMIN_SESSION_CHANGED_EVENT } from "@/lib/admin-auth";
import { clearCustomerSession } from "@/lib/customer-auth";
import type { AppPrincipal } from "@/lib/auth";
import { isMyBookingsPath } from "@/lib/customer-navigation";
import {
  NOTIFICATIONS_CHANGED_EVENT,
  type NotificationsResponse,
} from "@/lib/notifications";
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
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const accountPanelRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [principal, setPrincipal] = useState<AppPrincipal | null>(null);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const wasOpen = useRef(false);

  useEffect(() => {
    setPrincipal(getClientPrincipal());
  }, []);

  useEffect(() => {
    const syncPrincipal = () => setPrincipal(getClientPrincipal());
    window.addEventListener(ADMIN_SESSION_CHANGED_EVENT, syncPrincipal);
    return () =>
      window.removeEventListener(ADMIN_SESSION_CHANGED_EVENT, syncPrincipal);
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

  useEffect(() => {
    if (!accountOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setAccountOpen(false);
      requestAnimationFrame(() => accountButtonRef.current?.focus());
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !accountPanelRef.current?.contains(target) &&
        !accountButtonRef.current?.contains(target)
      ) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [accountOpen]);

  async function signOut() {
    setSigningOut(true);
    setMenuOpen(false);
    setAccountOpen(false);
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
  const wordmarkDestination = isCustomer ? "/vehicles" : "/";

  useEffect(() => {
    if (!isCustomer) {
      setNotificationUnreadCount(0);
      return;
    }

    let active = true;
    const loadUnreadCount = async () => {
      try {
        const response = await fetch("/api/notifications", {
          credentials: "same-origin",
        });
        const body = (await response
          .json()
          .catch(() => null)) as NotificationsResponse | null;
        if (active && response.ok && body)
          setNotificationUnreadCount(body.unreadCount);
      } catch {
        if (active) setNotificationUnreadCount(0);
      }
    };

    void loadUnreadCount();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, loadUnreadCount);
    return () => {
      active = false;
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, loadUnreadCount);
    };
  }, [isCustomer]);

  const customerInitials = isCustomer
    ? principal.fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "";

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header
        className={`customer-header${homeMarketing ? " is-home-marketing" : ""}`}
      >
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

          {homeMarketing && !principal ? (
            <nav
              className="customer-desktop-nav customer-marketing-nav"
              aria-label="Site navigation"
            >
              <a className="customer-nav-link" href="/vehicles">
                Our cars
              </a>
              <a className="customer-nav-link" href="#rental-assurances">
                How it works
              </a>
            </nav>
          ) : null}

          {!isAuthenticationPage ? (
            <div className="customer-header-account">
              {principal ? (
                isCustomer ? (
                  <div className="customer-account-menu">
                    <button
                      ref={accountButtonRef}
                      type="button"
                      className="customer-account-trigger"
                      aria-expanded={accountOpen}
                      aria-controls="customer-account-menu"
                      onClick={() => setAccountOpen((open) => !open)}
                    >
                      <UserRound
                        size={22}
                        strokeWidth={1.7}
                        aria-hidden="true"
                      />
                      <span>{accountLabel}</span>
                      <ChevronDown
                        className={accountOpen ? "is-open" : undefined}
                        size={17}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    </button>
                    {accountOpen ? (
                      <div
                        ref={accountPanelRef}
                        id="customer-account-menu"
                        className="customer-account-panel"
                      >
                        <div className="customer-account-summary">
                          <span
                            className="customer-account-initials"
                            aria-hidden="true"
                          >
                            {customerInitials}
                          </span>
                          <span>
                            <strong>{accountLabel}</strong>
                            <small>{principal.email}</small>
                          </span>
                        </div>
                        <nav aria-label="Account">
                          <Link
                            to="/customer/profile"
                            className="customer-account-menu-link"
                            onClick={() => setAccountOpen(false)}
                          >
                            <UserRound
                              size={18}
                              strokeWidth={1.7}
                              aria-hidden="true"
                            />
                            <span>Profile &amp; account</span>
                          </Link>
                          <Link
                            to="/customer"
                            className="customer-account-menu-link"
                            onClick={() => setAccountOpen(false)}
                          >
                            <CalendarDays
                              size={18}
                              strokeWidth={1.7}
                              aria-hidden="true"
                            />
                            <span>My bookings</span>
                          </Link>
                          <Link
                            to="/customer/notifications"
                            className="customer-account-menu-link"
                            onClick={() => setAccountOpen(false)}
                          >
                            <Bell
                              size={18}
                              strokeWidth={1.7}
                              aria-hidden="true"
                            />
                            <span>Notifications</span>
                            {notificationUnreadCount > 0 ? (
                              <span className="customer-notification-count">
                                {notificationUnreadCount}
                              </span>
                            ) : null}
                          </Link>
                        </nav>
                        <div className="customer-account-menu-footer">
                          <button
                            type="button"
                            className="customer-account-menu-link customer-account-sign-out"
                            onClick={() => void signOut()}
                            disabled={signingOut}
                          >
                            <LogOut
                              size={18}
                              strokeWidth={1.7}
                              aria-hidden="true"
                            />
                            <span>
                              {signingOut ? "Signing out…" : "Sign out"}
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <Link
                    to={isAdminWorkspace ? "/admin" : "/customer"}
                    className="customer-account-link"
                  >
                    <UserRound size={24} strokeWidth={1.7} aria-hidden="true" />
                    <span>{accountLabel}</span>
                  </Link>
                )
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
            </div>
          ) : null}

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
              {homeMarketing && !principal ? (
                <>
                  <a
                    className="customer-mobile-link"
                    href="/vehicles"
                    onClick={() => setMenuOpen(false)}
                  >
                    Our cars
                  </a>
                  <a
                    className="customer-mobile-link"
                    href="#rental-assurances"
                    onClick={() => setMenuOpen(false)}
                  >
                    How it works
                  </a>
                </>
              ) : null}
              {principal ? (
                <>
                  {isCustomer ? (
                    <div className="customer-mobile-account-links">
                      <p>Account</p>
                      <Link
                        to="/customer/profile"
                        className="customer-mobile-link"
                        onClick={() => setMenuOpen(false)}
                      >
                        Profile &amp; account
                      </Link>
                      <Link
                        to="/customer"
                        className={`customer-mobile-link${myBookingsActive ? " is-active" : ""}`}
                        aria-current={myBookingsActive ? "page" : undefined}
                        onClick={() => setMenuOpen(false)}
                      >
                        My bookings
                      </Link>
                      <Link
                        to="/customer/notifications"
                        className="customer-mobile-link"
                        onClick={() => setMenuOpen(false)}
                      >
                        Notifications
                        {notificationUnreadCount > 0
                          ? ` (${notificationUnreadCount})`
                          : ""}
                      </Link>
                    </div>
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
      <SignInDialog
        open={signInOpen}
        onOpenChange={setSignInOpen}
        onAuthenticated={() => setPrincipal(getClientPrincipal())}
      />
    </>
  );
}
