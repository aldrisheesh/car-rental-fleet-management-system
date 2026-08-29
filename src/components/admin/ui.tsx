import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && (
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card shadow-soft ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  hint,
  right,
}: {
  title: string;
  hint?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
      <div className="min-w-0">
        <h3 className="font-display text-sm font-semibold tracking-wide">{title}</h3>
        {hint && <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

export function KPI({
  label,
  value,
  delta,
  icon,
  accent,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${accent ? "border-primary/30 bg-gradient-to-br from-card to-primary/10" : "border-border bg-card"} p-5 shadow-soft`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-2.5 font-display text-2xl font-semibold tracking-tight">{value}</div>
          {delta && <div className="mt-1 text-xs text-primary">{delta}</div>}
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/15 text-primary">
          {icon}
        </span>
      </div>
    </div>
  );
}

const badgeMap: Record<string, string> = {
  // booking
  Pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Confirmed: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  Ongoing: "bg-primary/15 text-primary border-primary/30",
  Completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Cancelled: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  // payment
  Paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Invalid: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  // vehicle
  Available: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Reserved: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  Rented: "bg-primary/15 text-primary border-primary/30",
  Maintenance: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Inactive: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  // maintenance
  Scheduled: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  "In Progress": "bg-primary/15 text-primary border-primary/30",
  Overdue: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  // verification
  Verified: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Pending Verification": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Rejected: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  // users
  Active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Invited: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  Suspended: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export function Badge({ children, className = "" }: { children: string; className?: string }) {
  const cls = badgeMap[children] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cls} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {children}
    </span>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft">
      {children}
    </div>
  );
}

export function TInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input-control min-h-11 ${props.className ?? ""}`} />;
}

export function TSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`input-control min-h-11 ${props.className ?? ""}`} />;
}

export function Btn({
  children,
  variant = "default",
  ...rest
}: {
  children: ReactNode;
  variant?: "default" | "ghost" | "primary" | "danger";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const map = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    default: "border border-border bg-card text-foreground hover:bg-secondary",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-card",
    danger: "border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20",
  } as const;
  return (
    <button
      {...rest}
      className={`touch-target inline-flex items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${map[variant]} ${rest.className ?? ""}`}
    >
      {children}
    </button>
  );
}
