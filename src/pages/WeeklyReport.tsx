import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, TrendingDown, Smile } from "lucide-react";
import { useRoutines } from "@/hooks/useRoutines";
import { todayKey } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { MoodValue } from "@/lib/routine-types";

const MOOD_EMOJI: Record<MoodValue, string> = {
  great: "🙂",
  ok: "😐",
  tired: "😴",
  stressed: "😫",
};
const MOOD_LABEL: Record<MoodValue, string> = {
  great: "Happy",
  ok: "Normal",
  tired: "Tired",
  stressed: "Stressed",
};

const WeeklyReport = () => {
  const navigate = useNavigate();
  const r = useRoutines();
  const startOfWeek = r.state.settings?.startOfWeek ?? 1;

  const { days, completedTasks, moodStats, skipDay } = useMemo(() => {
    const today = todayKey();
    const out: { key: string; weekday: number; mood?: MoodValue; total: number; done: number; titles: string[]; isToday: boolean; isFuture: boolean }[] = [];
    const base = new Date(today + "T12:00:00");
    // Start of the current week based on user's startOfWeek setting
    const dow = base.getDay(); // 0=Sun..6=Sat
    const offsetToStart = (dow - startOfWeek + 7) % 7;
    const weekStart = new Date(base);
    weekStart.setDate(base.getDate() - offsetToStart);
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const k = todayKey(d);
      const isFuture = k > today;
      const isToday = k === today;
      const h = r.state.history[k];
      const titles: string[] = [];
      let done = 0;
      let total = 0;
      if (h) {
        for (const [rid, snap] of Object.entries(h.snapshot ?? {})) {
          const blocks = snap.blocks ?? [];
          const checks = blocks.filter((b: any) => b.type === "checkbox" && b.text?.trim());
          const doneChecks = checks.filter((b: any) => b.checked);
          total += checks.length;
          done += doneChecks.length;
          for (const b of doneChecks) titles.push(b.text!);
          if (h.completedRoutineIds.includes(rid) && checks.length === 0) {
            titles.push(snap.title);
            done += 1;
            total += 1;
          }
        }
      }
      out.push({
        key: k,
        weekday: d.getDay(),
        mood: r.state.moods?.[k],
        total,
        done,
        titles,
      });
    }

    // Mood stats
    const buckets: Record<MoodValue, { sum: number; n: number; tasks: number }> = {
      great: { sum: 0, n: 0, tasks: 0 },
      ok: { sum: 0, n: 0, tasks: 0 },
      tired: { sum: 0, n: 0, tasks: 0 },
      stressed: { sum: 0, n: 0, tasks: 0 },
    };
    for (const d of out) {
      if (!d.mood || d.total === 0) continue;
      buckets[d.mood].sum += d.done / d.total;
      buckets[d.mood].n += 1;
      buckets[d.mood].tasks += d.done;
    }

    // Skip day
    const dayMisses: Record<number, { miss: number; total: number }> = {};
    for (const d of out) {
      if (d.total === 0) continue;
      if (!dayMisses[d.weekday]) dayMisses[d.weekday] = { miss: 0, total: 0 };
      dayMisses[d.weekday].miss += d.total - d.done;
      dayMisses[d.weekday].total += d.total;
    }
    let worstDay: number | null = null;
    let worstRate = 0;
    for (const [k, v] of Object.entries(dayMisses)) {
      const rate = v.miss / v.total;
      if (rate > worstRate) {
        worstRate = rate;
        worstDay = Number(k);
      }
    }

    const totalCompleted = out.reduce((a, d) => a + d.done, 0);

    return {
      days: out,
      completedTasks: totalCompleted,
      moodStats: buckets,
      skipDay: worstDay !== null && worstRate > 0.2 ? { day: worstDay, rate: worstRate } : null,
    };
  }, [r.state]);

  const weekdayLabel = (n: number) =>
    new Date(2024, 0, 7 + n).toLocaleDateString(undefined, { weekday: "long" });

  // Reorder days for chart based on startOfWeek (visual only)
  const orderedDays = useMemo(() => {
    return [...days].sort((a, b) => a.key.localeCompare(b.key));
  }, [days]);

  const maxDone = Math.max(1, ...orderedDays.map((d) => d.done));

  return (
    <div className="min-h-full bg-background pb-20">
      <header className="safe-top px-5 pb-3 pt-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-serif font-bold">Weekly Report</h1>
      </header>

      <main className="px-5 space-y-5">
        {/* Hero */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-block">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-bold">Last 7 days</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-4xl font-semibold tabular-nums">{completedTasks}</p>
            <p className="text-sm text-muted-foreground mb-1.5">tasks completed</p>
          </div>

          <div className="mt-4 flex items-end justify-between gap-1.5 h-24">
            {orderedDays.map((d) => {
              const h = (d.done / maxDone) * 100;
              return (
                <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className={cn(
                        "w-full rounded-md transition-colors",
                        d.done === 0 ? "bg-muted" : "bg-foreground"
                      )}
                      style={{ height: `${Math.max(4, h)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    {new Date(d.key + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mood breakdown */}
        <section>
          <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1 mb-2.5 inline-flex items-center gap-1.5">
            <Smile size={11} /> Completion by mood
          </h3>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {(["great", "ok", "tired", "stressed"] as MoodValue[]).map((m, i, arr) => {
              const b = moodStats[m];
              const pct = b.n > 0 ? Math.round((b.sum / b.n) * 100) : null;
              return (
                <div
                  key={m}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5",
                    i !== arr.length - 1 && "border-b border-border"
                  )}
                >
                  <span className="text-xl leading-none">{MOOD_EMOJI[m]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold">{MOOD_LABEL[m]}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {b.n === 0 ? "No data this week" : `${b.tasks} tasks · ${b.n} day${b.n > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  {pct !== null && (
                    <div className="text-right">
                      <p className="text-[15px] font-bold tabular-nums">{pct}%</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">avg</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Skip pattern */}
        {skipDay && (
          <section>
            <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1 mb-2.5 inline-flex items-center gap-1.5">
              <TrendingDown size={11} /> Skip pattern
            </h3>
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
              <p className="text-[14px] text-foreground/80 leading-snug">
                You skip the most on{" "}
                <span className="font-bold text-foreground">{weekdayLabel(skipDay.day)}</span> —{" "}
                <span className="font-semibold tabular-nums">{Math.round(skipDay.rate * 100)}%</span> of tasks went
                undone.
              </p>
            </div>
          </section>
        )}

        {/* Completed tasks per day */}
        <section>
          <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1 mb-2.5 inline-flex items-center gap-1.5">
            <CheckCircle2 size={11} /> What you finished
          </h3>
          <div className="space-y-2">
            {orderedDays
              .slice()
              .reverse()
              .map((d) => (
                <div key={d.key} className="rounded-2xl border border-border bg-card p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-bold">
                      {new Date(d.key + "T12:00:00").toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <div className="flex items-center gap-2">
                      {d.mood && <span className="text-base">{MOOD_EMOJI[d.mood]}</span>}
                      <span className="text-[12px] text-muted-foreground tabular-nums">
                        {d.done}/{d.total}
                      </span>
                    </div>
                  </div>
                  {d.titles.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {d.titles.slice(0, 6).map((t, i) => (
                        <li key={i} className="text-[13px] text-foreground/80 flex items-start gap-2">
                          <span className="text-muted-foreground mt-0.5">·</span>
                          <span className="flex-1">{t}</span>
                        </li>
                      ))}
                      {d.titles.length > 6 && (
                        <li className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider pl-3">
                          + {d.titles.length - 6} more
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="mt-1.5 text-[12px] text-muted-foreground italic">Nothing logged.</p>
                  )}
                </div>
              ))}
          </div>
        </section>
        <p className="text-center text-[11px] text-muted-foreground">
          Week starts on {startOfWeek === 0 ? "Sunday" : "Monday"}
        </p>
      </main>
    </div>
  );
};

export default WeeklyReport;
