import { DialogThemeProvider } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Brain,
  Building2,
  CalendarDays,
  CalendarRange,
  Car,
  ChevronDown,
  ClipboardList,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  ShieldCheck,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  getAdminSession,
  isStaffRole,
  signOutAdmin,
  type AdminRole,
  type AdminSession,
} from "@/lib/admin-auth";
import {
  NOTIFICATIONS_CHANGED_EVENT,
  type NotificationsResponse,
} from "@/lib/notifications";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
};

type NavEntry = NavItem | NavGroup;

const ownerNav: NavEntry[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    id: "decision-support",
    label: "Decision Support",
    icon: Brain,
    items: [
      {
        to: "/admin/decisions/forecast",
        label: "Demand Forecast",
        icon: BarChart3,
      },
      {
        to: "/admin/decisions/allocation",
        label: "Fleet Allocation",
        icon: Car,
      },
      {
        to: "/admin/decisions/utilization",
        label: "Vehicle Utilization",
        icon: CalendarRange,
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: CalendarRange,
    items: [
      { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
      { to: "/admin/bookings", label: "Bookings", icon: ClipboardList },
      { to: "/admin/payments", label: "Payments", icon: CreditCard },
    ],
  },
  {
    id: "vehicle-management",
    label: "Vehicle Management",
    icon: Car,
    items: [
      { to: "/admin/fleet", label: "Fleet", icon: Car },
      {
        to: "/admin/maintenance",
        label: "Maintenance",
        icon: Wrench,
      },
      { to: "/admin/branches", label: "Locations", icon: Building2 },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    icon: ShieldCheck,
    items: [
      { to: "/admin/reports", label: "Reports", icon: BarChart3 },
      { to: "/admin/users", label: "Users & Roles", icon: ShieldCheck },
      { to: "/admin/activity", label: "Audit Trail", icon: ScrollText },
    ],
  },
];

const staffNav: NavEntry[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    id: "operations",
    label: "Operations",
    icon: CalendarRange,
    items: [
      { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
      { to: "/admin/bookings", label: "Bookings", icon: ClipboardList },
      { to: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
];

function isActive(pathname: string, item: NavItem) {
  if (
    pathname === "/admin/decisions" &&
    item.to === "/admin/decisions/forecast"
  )
    return true;
  return item.exact ? pathname === item.to : pathname.startsWith(item.to);
}

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

function flatNavItems(entries: NavEntry[]) {
  return entries.flatMap((entry) => (isNavGroup(entry) ? entry.items : entry));
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

function SidebarLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: NavEntry[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        items
          .filter(isNavGroup)
          .map((group) => [
            group.id,
            group.items.some((item) => isActive(pathname, item)),
          ]),
      ),
  );

  useEffect(() => {
    const activeGroup = items
      .filter(isNavGroup)
      .find((group) => group.items.some((item) => isActive(pathname, item)));
    if (!activeGroup) return;
    setExpandedGroups((current) =>
      current[activeGroup.id]
        ? current
        : { ...current, [activeGroup.id]: true },
    );
  }, [items, pathname]);

  return (
    <ul className="space-y-1.5">
      {items.map((entry) => {
        if (isNavGroup(entry)) {
          const groupActive = entry.items.some((item) =>
            isActive(pathname, item),
          );
          const expanded = expandedGroups[entry.id] || groupActive;
          const Icon = entry.icon;
          const regionId = `admin-nav-${entry.id}`;
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() =>
                  setExpandedGroups((current) => ({
                    ...current,
                    [entry.id]: !expanded,
                  }))
                }
                aria-expanded={expanded}
                aria-controls={regionId}
                className={`admin-sidebar-group group flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-md border border-transparent px-2.5 text-left text-[13px] font-semibold transition-[background-color,color,border-color] duration-150 hover:bg-secondary hover:text-foreground ${groupActive ? "is-active border-primary/10 bg-[#e7efec] text-primary" : "text-muted-foreground"}`}
              >
                <Icon
                  aria-hidden="true"
                  className={`admin-sidebar-icon h-5 w-5 shrink-0 ${groupActive ? "text-primary" : "text-[#19385e]"}`}
                  strokeWidth={1.9}
                />
                <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                />
              </button>
              <div
                id={regionId}
                aria-hidden={!expanded}
                className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <ul
                  className={`admin-sidebar-subnav ml-5 min-h-0 overflow-hidden pl-2 ${expanded ? "border-l border-[#c9d8d2] py-1.5" : "py-0"}`}
                >
                  {entry.items.map((item) => {
                    const active = isActive(pathname, item);
                    const ItemIcon = item.icon;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to as never}
                          search={
                            item.to.startsWith("/admin/decisions/")
                              ? true
                              : undefined
                          }
                          activeOptions={
                            item.exact ? { exact: true } : undefined
                          }
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          tabIndex={expanded ? undefined : -1}
                          className={`admin-sidebar-item group flex min-h-10 items-center gap-2.5 rounded-md px-2.5 text-sm transition-[background-color,color] duration-150 hover:bg-secondary hover:text-foreground ${active ? "is-active bg-[#e2ece6] font-semibold text-primary" : "text-muted-foreground"}`}
                        >
                          <ItemIcon
                            aria-hidden="true"
                            className={`admin-sidebar-icon h-4 w-4 shrink-0 ${active ? "text-primary" : "text-[#526c7b]"}`}
                            strokeWidth={1.9}
                          />
                          <span className="min-w-0 truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        }

        const item = entry;
        const active = isActive(pathname, item);
        const Icon = item.icon;
        return (
          <li key={item.to}>
            <Link
              to={item.to as never}
              activeOptions={item.exact ? { exact: true } : undefined}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`admin-sidebar-item group flex min-h-11 items-center gap-3 rounded-md border border-transparent px-3 text-sm font-medium transition-[background-color,color,border-color] duration-150 hover:bg-secondary hover:text-foreground ${active ? "is-active border-primary/10 bg-[#e7efec] text-primary" : "text-muted-foreground"}`}
            >
              <Icon
                aria-hidden="true"
                className={`admin-sidebar-icon h-5 w-5 shrink-0 ${active ? "text-primary" : "text-[#19385e]"}`}
                strokeWidth={1.9}
              />
              <span className="min-w-0 truncate">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminShell() {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const search = useRouterState({
    select: (state) => state.location.search as Record<string, unknown>,
  });
  const paymentBookingId =
    typeof search.fromBooking === "string" ? search.fromBooking : null;
  const [session, setSession] = useState<AdminSession | null | undefined>();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const role = session?.role as AdminRole | undefined;
  const staffView = isStaffRole(role);
  const navItems = staffView ? staffNav : ownerNav;

  useEffect(() => {
    const activeSession = getAdminSession();
    if (!activeSession) {
      setSession(null);
      void navigate({
        to: "/sign-in",
        replace: true,
      });
      return;
    }
    setSession(activeSession);
  }, [navigate]);

  useEffect(() => {
    function syncSession() {
      const activeSession = getAdminSession();
      setSession(activeSession);
      if (!activeSession) {
        void navigate({ to: "/sign-in", replace: true });
      }
    }
    window.addEventListener(ADMIN_SESSION_CHANGED_EVENT, syncSession);
    window.addEventListener("storage", syncSession);
    return () => {
      window.removeEventListener(ADMIN_SESSION_CHANGED_EVENT, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, [navigate]);

  useEffect(() => {
    if (!session) return;
    const staffPrefixes = [
      "/admin/bookings",
      "/admin/calendar",
      "/admin/notifications",
      "/admin/profile",
      "/admin/reports",
    ];
    const unsupportedSharedPaths = ["/admin/customers", "/admin/settings"];
    const staffCanStay =
      pathname === "/admin" ||
      staffPrefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      );
    const unsupported = unsupportedSharedPaths.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    if ((staffView && !staffCanStay) || unsupported) {
      void navigate({ to: "/admin", replace: true });
      return;
    }
    setMobileNavOpen(false);
  }, [navigate, pathname, session, staffView]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileNavOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    if (!session) {
      setNotificationUnreadCount(0);
      return;
    }
    let cancelled = false;
    async function loadUnreadCount() {
      try {
        const response = await fetch("/api/notifications", {
          credentials: "same-origin",
        });
        const body = (await response
          .json()
          .catch(() => null)) as NotificationsResponse | null;
        if (!cancelled && response.ok && body) {
          setNotificationUnreadCount(body.unreadCount);
        }
      } catch {
        if (!cancelled) setNotificationUnreadCount(0);
      }
    }
    void loadUnreadCount();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, loadUnreadCount);
    return () => {
      cancelled = true;
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, loadUnreadCount);
    };
  }, [pathname, session]);

  async function handleSignOut() {
    setSession(null);
    await signOutAdmin();
    void navigate({ to: "/", replace: true });
  }

  if (session === undefined) {
    return (
      <div className="admin-app grid min-h-screen place-items-center px-6 text-center">
        <div>
          <div className="text-lg font-semibold tracking-tight">
            Briah&apos;s Car Rental
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Checking admin session…
          </p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="admin-app min-h-screen overflow-x-clip">
      <a className="skip-link" href="#admin-main">
        Skip to main content
      </a>

      <aside className="admin-sidebar fixed inset-y-0 left-0 z-40 hidden w-[236px] flex-col border-r border-border bg-white lg:flex">
        <Link
          to="/admin"
          className="admin-sidebar-brand border-b border-border px-7 py-6"
          translate="no"
        >
          <span className="admin-sidebar-wordmark">
            <span>Briah&apos;s</span>
            <small>Car Rental</small>
          </span>
          <span className="admin-sidebar-context mt-2 block text-base text-muted-foreground">
            {staffView ? "Operations Staff" : "Admin Operations"}
          </span>
        </Link>

        <nav
          aria-label={staffView ? "Staff operations" : "Admin operations"}
          className="admin-scroll-region flex-1 overflow-y-auto px-3 py-7"
        >
          <SidebarLinks items={navItems} pathname={pathname} />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pt-[76px] lg:pl-[236px]">
        <header className="fixed inset-x-0 top-0 z-30 border-b border-border bg-white lg:left-[236px]">
          <div className="flex min-h-[76px] items-center gap-4 px-5 md:px-8 xl:px-10">
            <button
              type="button"
              className="touch-target inline-flex items-center gap-2 rounded-md border border-primary px-3 text-sm font-semibold text-primary lg:hidden"
              aria-controls="admin-mobile-navigation"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? (
                <X aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Menu aria-hidden="true" className="h-5 w-5" />
              )}
              <span>Menu</span>
            </button>

            <div className="flex min-w-0 items-center gap-3 lg:hidden">
              <span className="hidden text-xl font-semibold tracking-[-0.04em] text-primary sm:inline">
                Briah&apos;s Car Rental
              </span>
              <span className="truncate text-sm text-muted-foreground sm:border-l sm:border-border sm:pl-3">
                {staffView ? "Operations Staff" : "Owner/Admin"}
              </span>
            </div>

            <nav
              aria-label="Breadcrumb"
              className="hidden min-w-0 items-center gap-2 text-sm lg:flex"
            >
              {adminBreadcrumbs(pathname, paymentBookingId).map(
                (crumb, index) => (
                  <span
                    className="contents"
                    key={`${crumb.label}-${crumb.to ?? index}`}
                  >
                    {index > 0 ? (
                      <span aria-hidden="true" className="text-border">
                        /
                      </span>
                    ) : null}
                    {crumb.to ? (
                      <Link
                        to={crumb.to as never}
                        className="truncate text-muted-foreground hover:text-primary"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        aria-current="page"
                        className="truncate font-medium text-foreground"
                      >
                        {crumb.label}
                      </span>
                    )}
                  </span>
                ),
              )}
            </nav>

            <div className="ml-auto flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="admin-account-trigger touch-target inline-flex items-center gap-2 rounded-md px-1.5 text-left hover:bg-secondary"
                    aria-label="Open account menu"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-semibold text-white">
                      {getInitials(session.name)}
                    </span>
                    <span className="hidden min-w-0 leading-5 md:block">
                      <span className="block max-w-32 truncate text-sm font-semibold">
                        {session.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {session.role}
                      </span>
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className="hidden h-4 w-4 text-primary md:block"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="admin-account-menu w-60"
                >
                  <DropdownMenuLabel>
                    <span className="block text-sm font-semibold text-foreground">
                      {session.name}
                    </span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {session.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/admin/profile">
                      <UserRound aria-hidden="true" className="h-4 w-4" />
                      Profile &amp; account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/admin/notifications"
                      aria-label={`Notifications${notificationUnreadCount ? `, ${notificationUnreadCount} unread` : ""}`}
                    >
                      <Bell aria-hidden="true" className="h-4 w-4" />
                      <span>Notifications</span>
                      {notificationUnreadCount > 0 ? (
                        <span className="admin-account-notification-count">
                          {notificationUnreadCount > 99
                            ? "99+"
                            : notificationUnreadCount}
                        </span>
                      ) : null}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/vehicles" target="_blank" rel="noreferrer">
                      <ExternalLink aria-hidden="true" className="h-4 w-4" />
                      View customer site
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleSignOut}>
                    <LogOut aria-hidden="true" className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <nav
            id="admin-mobile-navigation"
            aria-label={staffView ? "Staff operations" : "Admin operations"}
            hidden={!mobileNavOpen}
            className="border-t border-border bg-white px-5 py-4 lg:hidden"
          >
            <SidebarLinks
              items={navItems}
              pathname={pathname}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </nav>
        </header>

        <main
          id="admin-main"
          tabIndex={-1}
          className="min-w-0 flex-1 px-5 py-7 md:px-8 md:py-8 xl:px-10"
        >
          <DialogThemeProvider value="admin">
            <Outlet />
          </DialogThemeProvider>
        </main>
      </div>
    </div>
  );
}

function currentLabel(pathname: string) {
  if (pathname.startsWith("/admin/bookings/")) return "Booking detail";
  if (pathname.startsWith("/admin/requirements")) return "Booking requirements";
  if (pathname.startsWith("/admin/payments")) return "Payment review";
  if (pathname.startsWith("/admin/notifications")) return "Notifications";
  if (pathname.startsWith("/admin/profile")) return "Profile & account";
  return (
    flatNavItems([...ownerNav, ...staffNav]).find((item) =>
      isActive(pathname, item),
    )?.label ?? "Dashboard"
  );
}

function adminBreadcrumbs(pathname: string, paymentBookingId: string | null) {
  if (pathname.startsWith("/admin/bookings/"))
    return [
      { label: "Operations", to: "/admin/bookings" },
      { label: "Bookings", to: "/admin/bookings" },
      { label: "Booking detail" },
    ];
  if (pathname.startsWith("/admin/payments/") && paymentBookingId)
    return [
      { label: "Operations", to: "/admin/bookings" },
      { label: "Bookings", to: "/admin/bookings" },
      {
        label: "Booking detail",
        to: `/admin/bookings/${encodeURIComponent(paymentBookingId)}`,
      },
      { label: "Payment record" },
    ];
  if (pathname.startsWith("/admin/payments/"))
    return [
      { label: "Operations", to: "/admin/payments" },
      { label: "Bookings", to: "/admin/bookings" },
      { label: "Payments", to: "/admin/payments" },
      { label: "Payment record" },
    ];
  if (pathname.startsWith("/admin/calendar"))
    return [
      { label: "Operations", to: "/admin/calendar" },
      { label: "Calendar" },
    ];
  if (pathname.startsWith("/admin/bookings"))
    return [
      { label: "Operations", to: "/admin/bookings" },
      { label: "Bookings" },
    ];
  if (pathname.startsWith("/admin/payments"))
    return [
      { label: "Operations", to: "/admin/payments" },
      { label: "Payments" },
    ];
  if (pathname.startsWith("/admin/fleet"))
    return [
      { label: "Vehicle management", to: "/admin/fleet" },
      { label: "Fleet" },
    ];
  if (pathname.startsWith("/admin/maintenance"))
    return [
      { label: "Vehicle management", to: "/admin/fleet" },
      { label: "Maintenance" },
    ];
  return [{ label: currentLabel(pathname) }];
}
