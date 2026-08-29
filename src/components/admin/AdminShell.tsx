import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarRange,
  Users,
  Car,
  CreditCard,
  Wrench,
  CalendarDays,
  BarChart3,
  Brain,
  Building2,
  Bell,
  ShieldCheck,
  Search,
  MoreHorizontal,
  LogOut,
  UserRound,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ADMIN_SESSION_CHANGED_EVENT,
  canAccessPayments,
  getAdminSession,
  isStaffRole,
  signOutAdmin,
} from "@/lib/admin-auth";
import { clearCustomerSession } from "@/lib/customer-auth";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const navStaffModules: NavItem[] = [
  { to: "/admin/bookings", label: "Bookings", icon: CalendarRange },
  { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
];

const navCoreOperations: NavItem[] = [
  { to: "/admin/bookings", label: "Bookings", icon: CalendarRange },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/fleet", label: "Fleet Management", icon: Car },
  { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/admin/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
];

const navDecisionSupport: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/admin/decisions", label: "Decision Support", icon: Brain },
];

const navAdminOnly: NavItem[] = [
  { to: "/admin/users", label: "Users & Roles", icon: ShieldCheck },
  { to: "/admin/branches", label: "Branches", icon: Building2 },
];

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.to : pathname.startsWith(item.to);
}

function SidebarSection({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div>
      {title ? (
        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </div>
      ) : null}
      <ul className="space-y-0.5">
        {items.map((n) => (
          <li key={n.to}>
            <Link
              to={n.to as never}
              activeOptions={n.exact ? { exact: true } : undefined}
              className="group flex items-center gap-3 rounded-md border border-transparent border-l-2 border-l-transparent px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground"
              activeProps={{
                className: "text-foreground border-l-primary bg-transparent",
              }}
            >
              <n.icon className="h-4 w-4 shrink-0 opacity-80" />
              <span className="truncate">{n.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminShell() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [session, setSession] = useState<ReturnType<typeof getAdminSession> | undefined>();
  const role = session?.role;
  const staffView = isStaffRole(role);
  const canViewPayments = canAccessPayments(role);
  const coreOperations = canViewPayments
    ? navCoreOperations
    : navCoreOperations.filter((item) => item.to !== "/admin/payments");
  const navAdmin = staffView ? [] : navAdminOnly;
  const navAll: NavItem[] = staffView
    ? navStaffModules
    : [...navDecisionSupport, ...coreOperations, ...navAdmin];
  const current = navAll.find((n) => isActive(pathname, n));
  const currentLabel = pathname.startsWith("/admin/profile")
    ? "Edit Profile"
    : (current?.label ?? "Dashboard");
  const userInitials = getInitials(session?.name ?? "");
  const mobileNavItems = staffView ? navStaffModules : [...navDecisionSupport, ...coreOperations];

  useEffect(() => {
    const activeSession = getAdminSession();
    if (!activeSession) {
      void navigate({ to: "/sign-in", replace: true });
      return;
    }
    setSession(activeSession);
  }, [navigate]);

  useEffect(() => {
    function syncSession() {
      setSession(getAdminSession());
    }

    window.addEventListener(ADMIN_SESSION_CHANGED_EVENT, syncSession);
    window.addEventListener("storage", syncSession);
    return () => {
      window.removeEventListener(ADMIN_SESSION_CHANGED_EVENT, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    if (!canAccessPayments(session.role) && pathname.startsWith("/admin/payments")) {
      void navigate({ to: "/admin", replace: true });
    }
  }, [navigate, pathname, session]);

  useEffect(() => {
    if (!session) return;
    if (!isStaffRole(session.role)) return;

    if (pathname === "/admin") {
      void navigate({ to: "/admin/bookings", replace: true });
      return;
    }

    const allowedPrefixes = ["/admin/bookings", "/admin/calendar", "/admin/profile"];

    if (
      !allowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    ) {
      void navigate({ to: "/admin/bookings", replace: true });
    }
  }, [navigate, pathname, session]);

  function handleSignOut() {
    signOutAdmin();
    clearCustomerSession();
    setSession(null);
    void navigate({ to: "/", replace: true });
  }

  if (session == null) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center text-foreground">
        <div>
          <div className="font-display text-lg font-semibold tracking-tight">
            Briah&apos;s Car Rental
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Checking admin session...</p>
        </div>
      </div>
    );
  }

  function getInitials(name: string) {
    const initials = name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");

    return initials || "A";
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface/80 backdrop-blur lg:flex">
        <Link to="/" className="flex h-16 items-center gap-3 border-b border-border px-5">
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold tracking-tight">
              Briah&apos;s Car Rental
            </div>
            <div className="font-display text-sm font-semibold uppercase tracking-wider">
              {isStaffRole(role) ? "Staff" : "Admin"}
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Operations
            </div>
          </div>
        </Link>

        <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-6">
            {staffView ? (
              <SidebarSection title="Modules" items={navStaffModules} />
            ) : (
              <>
                <SidebarSection title="Decision Support" items={navDecisionSupport} />
                <SidebarSection title="Core Operations" items={coreOperations} />
                <SidebarSection title="" items={navAdmin} />
              </>
            )}
          </div>
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-md bg-card px-3 py-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 font-display text-xs font-semibold text-primary">
              {userInitials}
            </span>
            <div className="leading-tight">
              <div className="text-[13px] font-medium">{session.name}</div>
              <div className="text-[11px] text-muted-foreground">{session.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-4 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <span>{isStaffRole(role) ? "Staff" : "Admin"}</span>
            <span className="text-border">/</span>
            <span className="truncate text-foreground">{currentLabel}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <label className="hidden min-h-11 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground md:flex">
              <Search className="h-4 w-4" />
              <input
                className="w-56 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                placeholder="Search bookings, plates, customers"
              />
              <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
            </label>
            <Link
              to={"/admin/notifications" as never}
              aria-label="Notifications"
              className="touch-target relative grid place-items-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                3
              </span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Open user menu"
                  className="touch-target grid place-items-center rounded-md border border-border bg-card px-2.5 text-sm transition-colors hover:bg-secondary"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                    {userInitials}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="py-2">
                  <div className="text-sm font-medium text-foreground">{session.name}</div>
                  <div className="text-xs font-normal text-muted-foreground">{session.role}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={"/admin/profile" as never}>
                    <UserRound className="h-4 w-4" />
                    Edit Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleSignOut}
                  className="text-rose-400 focus:text-rose-400"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <nav className="border-b border-border bg-surface/80 px-4 py-3 lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Admin sections">
            {mobileNavItems.map((n) => (
              <Link
                key={n.to}
                to={n.to as never}
                activeOptions={n.exact ? { exact: true } : undefined}
                className="touch-target inline-flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{
                  className: "border-primary/30 bg-primary/10 text-primary",
                }}
              >
                <n.icon className="h-4 w-4 shrink-0" />
                <span>{n.label}</span>
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="touch-target inline-flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="More admin sections"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span>More</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{isStaffRole(role) ? "Management" : "Admin"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {navAdmin.map((n) => (
                  <DropdownMenuItem key={n.to} asChild>
                    <Link to={n.to as never} activeOptions={n.exact ? { exact: true } : undefined}>
                      <n.icon className="h-4 w-4" />
                      {n.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
