import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame } from "lucide-react";
import { useRoutines } from "@/hooks/useRoutines";
import { todayKey, yesterdayKey } from "@/lib/storage";
import { cn } from "@/lib/utils";

const monthLabel = (d: Date) => d.toLocaleDateString(undefined, { month: "long", year: "numeric" });

/**
 * Current streak = consecutive days (ending today, or yesterday if today isn't perfect yet)
 * where the day had at least one routine AND every routine was completed.
 * A partial/empty day breaks the streak.
 */
const computeStreak = (history: Record<string, { completedRoutineIds: string[]; total: number }>) => {
  const today = todayKey();
  const isPerfect = (k: string) => {
    const d = history[k];
    return !!d && d.total > 0 && d.completedRoutineIds.length >= d.total;
  };

  let cursor: Date;
  if (isPerfect(today)) {
    cursor = new Date();
  } else {
    // Today not perfect — streak, if any, ended yesterday.
    cursor = new Date(yesterdayKey() + "T12:00:00");
  }

  let streak = 0;
  for (;;) {
    const k = todayKey(cursor);
    if (!isPerfect(k)) break;
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
            (() => {
              const completedIds = selectedDay.completedRoutineIds;
              const entries = Object.entries(selectedDay.snapshot);
              const completed = entries.filter(([rid]) => completedIds.includes(rid));
              const missed = entries.filter(([rid]) => !completedIds.includes(rid));
              const ratio = selectedDay.total === 0 ? 0 : completed.length / selectedDay.total;
              const perfect = ratio >= 1;

              return (
                <>
                  <div className="mt-1 flex items-baseline gap-2">
                    <p className="text-2xl font-semibold tabular-nums">
                      {completed.length}
                      <span className="text-muted-foreground text-base font-medium"> / {selectedDay.total}</span>
                    </p>
                    {perfect ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
                        <Flame size={11} strokeWidth={2.5} /> Streak day
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {Math.round(ratio * 100)}% complete
                      </span>
                    )}
                  </div>

                  {/* Completed routines */}
                  <div className="mt-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">
                      Completed ({completed.length})
                    </p>
                    {completed.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No routines were completed this day.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {completed.map(([rid, snap]) => (
                          <li
                            key={rid}
                            className="flex items-center gap-3 rounded-lg border border-success/20 bg-success-soft/40 px-3 py-2 text-sm"
                          >
                            <span className="h-4 w-4 rounded-sm bg-success border border-success text-success-foreground flex items-center justify-center text-[10px]">
                              ✓
                            </span>
                            <span className="text-base leading-none">{snap.emoji ?? "•"}</span>
                            <span className="flex-1 truncate font-medium">{snap.title}</span>
                            {snap.sectionTitle && (
                              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {snap.sectionTitle}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Missed routines */}
                  {missed.length > 0 && (
                    <div className="mt-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">
                        Missed ({missed.length})
                      </p>
                      <ul className="space-y-1.5">
                        {missed.map(([rid, snap]) => (
                          <li
                            key={rid}
                            className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm opacity-70"
                          >
                            <span className="h-4 w-4 rounded-sm border border-input" />
                            <span className="text-base leading-none">{snap.emoji ?? "•"}</span>
                            <span className="flex-1 truncate text-muted-foreground">{snap.title}</span>
                            {snap.sectionTitle && (
                              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {snap.sectionTitle}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              );
            })()
          )}
        </div>
      </main>
    </div>
  );
};

export default History;
