import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame } from "lucide-react";
import { useRoutines } from "@/hooks/useRoutines";
import { todayKey, yesterdayKey } from "@/lib/storage";
import { cn } from "@/lib/utils";

const monthLabel = (d: Date) => d.toLocaleDateString(undefined, { month: "long", year: "numeric" });

/** Compute current streak: consecutive days ending today (or yesterday) where total>0 and all completed. */
const computeStreak = (history: Record<string, { completedRoutineIds: string[]; total: number }>) => {
  let cursor = new Date();
  let streak = 0;
  // If today not fully complete, start from yesterday
  const today = todayKey();
  const t = history[today];
  if (!t || t.total === 0 || t.completedRoutineIds.length < t.total) {
    cursor = new Date(yesterdayKey() + "T12:00:00");
  }
  for (;;) {
    const k = todayKey(cursor);
    const day = history[k];
    if (!day || day.total === 0 || day.completedRoutineIds.length < day.total) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const History = () => {
  const navigate = useNavigate();
  const { state } = useRoutines();
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string>(todayKey());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayK = todayKey();

  const cells = useMemo(() => {
    const arr: Array<{ key: string | null; day: number | null }> = [];
    for (let i = 0; i < startWeekday; i++) arr.push({ key: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = todayKey(new Date(year, month, d));
      arr.push({ key, day: d });
    }
    return arr;
  }, [year, month, daysInMonth, startWeekday]);

  const streak = useMemo(() => computeStreak(state.history), [state.history]);

  const dayInfo = (key: string) => {
    const h = state.history[key];
    if (!h || h.total === 0) return { ratio: 0, full: false, has: false };
    const ratio = h.completedRoutineIds.length / h.total;
    return { ratio, full: ratio >= 1, has: true };
  };

  const selectedDay = state.history[selected];

  return (
    <div className="min-h-full bg-background pb-24">
      <header className="safe-top sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-2 py-2">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-semibold">History</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="px-5 pt-4 space-y-6">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-block">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium">Current streak</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums flex items-center gap-2">
                {streak}
                <Flame size={20} className="text-accent" strokeWidth={2.5} />
              </p>
            </div>
            <p className="text-xs text-muted-foreground max-w-[140px] text-right">
              Days where every routine was checked off.
            </p>
          </div>
        </div>

        {/* Calendar */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-block">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="px-2 py-1 rounded text-muted-foreground hover:bg-muted text-sm"
            >
              ‹
            </button>
            <p className="text-sm font-semibold">{monthLabel(cursor)}</p>
            <button
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="px-2 py-1 rounded text-muted-foreground hover:bg-muted text-sm"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((c, i) => {
              if (!c.key) return <div key={i} className="aspect-square" />;
              const info = dayInfo(c.key);
              const isToday = c.key === todayK;
              const isSelected = c.key === selected;
              const isFuture = c.key > todayK;
              return (
                <button
                  key={i}
                  disabled={isFuture}
                  onClick={() => setSelected(c.key!)}
                  className={cn(
                    "aspect-square rounded-md text-xs font-medium relative flex items-center justify-center transition-smooth",
                    isFuture && "opacity-30",
                    !isSelected && !info.full && "hover:bg-muted",
                    info.full && "bg-success text-success-foreground",
                    info.has && !info.full && "bg-success-soft text-foreground",
                    isSelected && "ring-2 ring-foreground ring-offset-1 ring-offset-card",
                    isToday && !info.full && "border border-foreground",
                  )}
                >
                  {c.day}
                  {info.full && (
                    <Flame
                      size={9}
                      strokeWidth={3}
                      className="absolute -top-1 -right-1 text-accent bg-card rounded-full p-0.5"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-success" /> All done
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-success-soft" /> Partial
            </span>
            <span className="flex items-center gap-1">
              <Flame size={10} className="text-accent" /> Streak day
            </span>
          </div>
        </div>

        {/* Selected day detail */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-block">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium">
            {new Date(selected + "T12:00:00").toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          {!selectedDay || selectedDay.total === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No data for this day.</p>
          ) : (
            <>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {selectedDay.completedRoutineIds.length}
                <span className="text-muted-foreground text-base font-medium"> / {selectedDay.total} completed</span>
              </p>
              <ul className="mt-4 space-y-2">
                {Object.entries(selectedDay.snapshot).map(([rid, snap]) => {
                  const done = selectedDay.completedRoutineIds.includes(rid);
                  return (
                    <li
                      key={rid}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm",
                        done ? "bg-success-soft/40" : "opacity-70",
                      )}
                    >
                      <span
                        className={cn(
                          "h-4 w-4 rounded-sm border flex items-center justify-center text-[10px]",
                          done ? "bg-success border-success text-success-foreground" : "border-input",
                        )}
                      >
                        {done && "✓"}
                      </span>
                      {snap.emoji && <span>{snap.emoji}</span>}
                      <span className={cn("flex-1 truncate", done && "line-through text-muted-foreground")}>
                        {snap.title}
                      </span>
                      {snap.sectionTitle && (
                        <span className="text-[10px] text-muted-foreground">{snap.sectionTitle}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;
