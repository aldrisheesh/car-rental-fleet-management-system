import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, LayoutDashboard, LogOut, Menu, UserRound, X } from "lucide-react";
import { SignInDialog } from "@/components/site/SignInDialog";
import { clearCustomerSession, getCustomerSession } from "@/lib/customer-auth";

type NavLink = {
  to: "/" | "/vehicles" | "/booking" | "/contact" | "/customer";
  label: string;
  exact?: boolean;
};

export function Header() {
  const navigate = useNavigate();
  const [signInOpen, setSignInOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const customerSession = getCustomerSession();
  const showCustomerDashboardLink = customerSession != null;
  const navLinks: NavLink[] = [
    { to: "/", label: "Home", exact: true },
    { to: "/vehicles", label: "Vehicles" },
    { to: "/booking", label: "Booking" },
    { to: "/contact", label: "Contact" },
  ];
  if (showCustomerDashboardLink) {
    navLinks.push({ to: "/customer", label: "Customer Dashboard" });
  }
  const customerInitials = getInitials(customerSession?.name ?? "");

  function openSignIn() {
    setMenuOpen(false);
    setAccountOpen(false);
    setSignInOpen(true);
  }

  function signOut() {
    clearCustomerSession();
    setMenuOpen(false);
    setAccountOpen(false);
    setSignInOpen(false);
    void navigate({ to: "/", replace: true });
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container-page flex min-h-16 items-center justify-between gap-3">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="flex min-w-0 items-center rounded-md text-foreground transition-colors hover:text-primary"
          >
            <span className="truncate font-display text-base font-semibold tracking-tight sm:text-lg">
              Briah&apos;s Car Rental
            </span>
          </Link>

          <nav className="hidden items-center gap-9 text-sm font-medium text-muted-foreground md:flex">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "text-foreground" }}
                activeOptions={item.exact ? { exact: true } : undefined}
                className="rounded-sm transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {customerSession ? (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((open) => !open)}
                  className="touch-target inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 font-display text-xs text-primary">
                    {customerInitials}
                  </span>
                  <span className="max-w-32 truncate">{customerSession.name}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-card text-sm shadow-card">
                    <div className="border-b border-border px-4 py-3">
                      <div className="truncate font-semibold text-foreground">
                        {customerSession.name}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {customerSession.email}
                      </div>
                    </div>
                    <div className="p-1.5">
                      <Link
                        to="/customer"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Customer Dashboard
                      </Link>
                      <Link
                        to="/customer/profile"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <UserRound className="h-4 w-4" />
                        Edit Profile
                      </Link>
                      <button
                        type="button"
                        onClick={signOut}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={openSignIn}
                className="touch-target hidden items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:inline-flex"
              >
                Sign In / Sign Up
              </button>
            )}
            <button
              type="button"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              onClick={() => {
                setAccountOpen(false);
                setMenuOpen((open) => !open);
              }}
              className="touch-target grid place-items-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-secondary md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-border bg-background/95 md:hidden">
            <nav className="container-page grid gap-2 py-3 text-sm font-medium text-muted-foreground">
              {navLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeProps={{ className: "bg-primary/10 text-primary border-primary/30" }}
                  activeOptions={item.exact ? { exact: true } : undefined}
                  onClick={() => setMenuOpen(false)}
                  className="touch-target flex items-center rounded-md border border-transparent px-3 transition-colors hover:bg-card hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              {customerSession ? (
                <>
                  <Link
                    to="/customer/profile"
                    activeProps={{ className: "bg-primary/10 text-primary border-primary/30" }}
                    onClick={() => setMenuOpen(false)}
                    className="touch-target flex items-center rounded-md border border-transparent px-3 transition-colors hover:bg-card hover:text-foreground"
                  >
                    Edit Profile
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="touch-target inline-flex w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={openSignIn}
                  className="touch-target inline-flex w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Sign In / Sign Up
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  );
}

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "C";
}
