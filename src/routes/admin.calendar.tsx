import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, PageHeader } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/calendar")({ component: CalendarPage });

// May 2026 starts on Friday (day index 5)
const monthName = "May 2026";
const daysInMonth = 31;
const startOffset = 5;

type Event = { day: number; label: string; kind: "rental" | "return" | "maint" | "reserve" };
const events: Event[] = [
  { day: 22, label: "Toyota Vios pickup",    kind: "rental"  },
  { day: 24, label: "Hiace PMS overdue",     kind: "maint"   },
  { day: 25, label: "Innova reserve",        kind: "reserve" },
  { day: 25, label: "Wigo return",           kind: "return"  },
  { day: 26, label: "Urvan reserve",         kind: "reserve" },
  { day: 27, label: "Hiace pickup • Taft",   kind: "rental"  },
  { day: 28, label: "Rush return",           kind: "return"  },
  { day: 28, label: "Vios aircon recharge",  kind: "maint"   },
  { day: 29, label: "Everest reserve",       kind: "reserve" },
  { day: 30, label: "Rush pickup • Antipolo",kind: "rental"  },
];

const kindStyles: Record<Event["kind"], string> = {
  rental:  "bg-primary/15 text-primary border-primary/30",
  return:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  maint:   "bg-amber-500/15 text-amber-400 border-amber-500/30",
  reserve: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};
const kindLabel: Record<Event["kind"], string> = {
  rental: "Active rental", return: "Return", maint: "Maintenance", reserve: "Reservation",
};

function CalendarPage() {
  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Unified view of pickups, returns, reservations and maintenance."
      />

      <Card>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <button className="grid h-8 w-8 place-items-center rounded-md border border-border bg-background hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
            <h3 className="font-display text-base font-semibold">{monthName}</h3>
            <button className="grid h-8 w-8 place-items-center rounded-md border border-border bg-background hover:bg-secondary"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {(Object.keys(kindLabel) as Event["kind"][]).map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${kindStyles[k].split(" ")[0].replace("/15", "")}`} />
                <span className="text-muted-foreground">{kindLabel[k]}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-border bg-secondary/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} className="border-r border-border px-3 py-2 last:border-r-0">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const isWeekend = i % 7 === 0 || i % 7 === 6;
            const evs = d ? events.filter((e) => e.day === d) : [];
            const today = d === 24;
            return (
              <div key={i} className={`min-h-32 border-b border-r border-border p-2 last:border-r-0 ${isWeekend ? "bg-background/40" : ""} ${i >= cells.length - 7 ? "border-b-0" : ""}`}>
                {d && (
                  <>
                    <div className={`mb-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs ${today ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground"}`}>{d}</div>
                    <div className="space-y-1">
                      {evs.map((e, j) => (
                        <div key={j} className={`truncate rounded border px-1.5 py-0.5 text-[10px] font-medium ${kindStyles[e.kind]}`}>{e.label}</div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Upcoming pickups" />
          <ul className="divide-y divide-border text-sm">
            {events.filter((e) => e.kind === "rental" || e.kind === "reserve").map((e, i) => (
              <li key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="font-medium">{e.label}</div>
                  <div className="text-xs text-muted-foreground">May {e.day}, 2026 • 10:00 AM</div>
                </div>
                <span className={`rounded border px-2 py-0.5 text-[10px] font-medium ${kindStyles[e.kind]}`}>{kindLabel[e.kind]}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Service & returns" />
          <ul className="divide-y divide-border text-sm">
            {events.filter((e) => e.kind === "maint" || e.kind === "return").map((e, i) => (
              <li key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="font-medium">{e.label}</div>
                  <div className="text-xs text-muted-foreground">May {e.day}, 2026 • Bay 2</div>
                </div>
                <span className={`rounded border px-2 py-0.5 text-[10px] font-medium ${kindStyles[e.kind]}`}>{kindLabel[e.kind]}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
