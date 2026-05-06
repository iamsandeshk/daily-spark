import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, TrendingDown, Smile, Download } from "lucide-react";
import { useRoutines } from "@/hooks/useRoutines";
import { todayKey, todayLiveHistory } from "@/lib/storage";
import { Flame, Trophy } from "lucide-react";
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
  const [mode, setMode] = useState<"week" | "weeks7">("week");

  const { days, completedTasks, moodStats, skipDay } = useMemo(() => {
    const today = todayKey();
    const out: { key: string; weekday: number; mood?: MoodValue; total: number; done: number; titles: string[]; isToday: boolean; isFuture: boolean; displayKey: string; isFromLastWeek: boolean }[] = [];
    const base = new Date(today + "T12:00:00");
    const dow = base.getDay();
    const offsetToStart = (dow - startOfWeek + 7) % 7;
    const weekStart = new Date(base);
    weekStart.setDate(base.getDate() - offsetToStart);

    const readDay = (k: string, live: boolean) => {
      const h = live ? todayLiveHistory(r.state) : r.state.history[k];
      const titles: string[] = [];
      let done = 0;
      let total = 0;
      if (h) {
        for (const [rid, snap] of Object.entries(h.snapshot ?? {})) {
          const blocks = (snap as any).blocks ?? [];
          const checks = blocks.filter((b: any) => b.type === "checkbox" && b.text?.trim());
          const doneChecks = checks.filter((b: any) => b.checked);
          total += checks.length;
          done += doneChecks.length;
          for (const b of doneChecks) titles.push(b.text!);
          if (h.completedRoutineIds.includes(rid) && checks.length === 0) {
            titles.push((snap as any).title);
            done += 1;
            total += 1;
          }
        }
      }
      return { titles, done, total };
    };

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const k = todayKey(d);
      const isFuture = k > today;
      const isToday = k === today;
      // For future days in current week, show last week's same weekday data instead
      let displayKey = k;
      let isFromLastWeek = false;
      if (isFuture) {
        const prev = new Date(d);
        prev.setDate(d.getDate() - 7);
        displayKey = todayKey(prev);
        isFromLastWeek = true;
      }
      const data = readDay(displayKey, !isFuture && isToday);
      out.push({
        key: k,
        displayKey,
        isFromLastWeek,
        weekday: d.getDay(),
        mood: r.state.moods?.[displayKey],
        total: data.total,
        done: data.done,
        titles: data.titles,
        isToday,
        isFuture,
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
      if (d.isFromLastWeek) continue;
      if (!d.mood || d.total === 0) continue;
      buckets[d.mood].sum += d.done / d.total;
      buckets[d.mood].n += 1;
      buckets[d.mood].tasks += d.done;
    }

    // Skip day
    const dayMisses: Record<number, { miss: number; total: number }> = {};
    for (const d of out) {
      if (d.isFromLastWeek) continue;
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

    const totalCompleted = out.reduce((a, d) => a + (d.isFromLastWeek ? 0 : d.done), 0);

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

  // Streak calculations within the week
  const { currentStreak, bestStreak } = useMemo(() => {
    const isFull = (d: typeof orderedDays[number]) => d.total > 0 && d.done >= d.total;
    let best = 0;
    let run = 0;
    for (const d of orderedDays) {
      if (d.isFuture) continue;
      if (isFull(d)) {
        run += 1;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }
    // current streak: consecutive full days ending at today (or last past day)
    let cur = 0;
    const past = orderedDays.filter((d) => !d.isFuture);
    for (let i = past.length - 1; i >= 0; i--) {
      if (isFull(past[i])) cur += 1;
      else break;
    }
    return { currentStreak: cur, bestStreak: best };
  }, [orderedDays]);

  // Last 7 weeks aggregation (each bar = 1 week)
  const weeks7 = useMemo(() => {
    const today = todayKey();
    const base = new Date(today + "T12:00:00");
    const dow = base.getDay();
    const offsetToStart = (dow - startOfWeek + 7) % 7;
    const thisWeekStart = new Date(base);
    thisWeekStart.setDate(base.getDate() - offsetToStart);

    const out: { label: string; key: string; done: number; total: number; isCurrent: boolean }[] = [];
    for (let w = 6; w >= 0; w--) {
      const start = new Date(thisWeekStart);
      start.setDate(thisWeekStart.getDate() - w * 7);
      let done = 0;
      let total = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const k = todayKey(d);
        if (k > today) continue;
        const h = k === today ? todayLiveHistory(r.state) : r.state.history[k];
        if (!h) continue;
        for (const [rid, snap] of Object.entries(h.snapshot ?? {})) {
          const blocks = (snap as any).blocks ?? [];
          const checks = blocks.filter((b: any) => b.type === "checkbox" && b.text?.trim());
          total += checks.length;
          done += checks.filter((b: any) => b.checked).length;
          if (h.completedRoutineIds.includes(rid) && checks.length === 0) {
            done += 1;
            total += 1;
          }
        }
      }
      out.push({
        label: `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
        key: todayKey(start),
        done,
        total,
        isCurrent: w === 0,
      });
    }
    return out;
  }, [r.state, startOfWeek]);

  const handleExport = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      weekStartsOn: startOfWeek === 0 ? "Sunday" : "Monday",
      currentStreak,
      bestStreak,
      completedTasks,
      thisWeek: orderedDays.map((d) => ({
        date: d.displayKey,
        weekday: new Date(d.displayKey + "T12:00:00").toLocaleDateString(undefined, { weekday: "long" }),
        done: d.done,
        total: d.total,
        completion: d.total > 0 ? Math.round((d.done / d.total) * 100) : 0,
        fromLastWeek: d.isFromLastWeek,
        titles: d.titles,
        mood: d.mood ?? null,
      })),
      last7Weeks: weeks7.map((w) => ({
        weekStart: w.key,
        done: w.done,
        total: w.total,
        completion: w.total > 0 ? Math.round((w.done / w.total) * 100) : 0,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weekly-report-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        <h1 className="text-2xl font-serif font-bold flex-1">Weekly Report</h1>
        <button
          onClick={handleExport}
          className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
          aria-label="Export report"
          title="Export as JSON"
        >
          <Download size={18} />
        </button>
      </header>

      <main className="px-5 space-y-5">
        {/* Mode toggle */}
        <div className="inline-flex rounded-full border border-border bg-muted/40 p-0.5 text-[12px] font-bold">
          <button
            onClick={() => setMode("week")}
            className={cn(
              "px-3 py-1.5 rounded-full transition-smooth",
              mode === "week" ? "bg-foreground text-background" : "text-muted-foreground"
            )}
          >
            This week
          </button>
          <button
            onClick={() => setMode("weeks7")}
            className={cn(
              "px-3 py-1.5 rounded-full transition-smooth",
              mode === "weeks7" ? "bg-foreground text-background" : "text-muted-foreground"
            )}
          >
            Last 7 weeks
          </button>
        </div>

        {/* Hero */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-block">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-bold">
            {mode === "week" ? "This week" : "Last 7 weeks"}
          </p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-4xl font-semibold tabular-nums">
              {mode === "week" ? completedTasks : weeks7.reduce((a, w) => a + w.done, 0)}
            </p>
            <p className="text-sm text-muted-foreground mb-1.5">tasks completed</p>
          </div>

          {/* Streak summary */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-background/40 px-3 py-2.5 flex items-center gap-2.5">
              <Flame size={16} className="text-primary" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Current</p>
                <p className="text-[15px] font-bold tabular-nums leading-tight">
                  {currentStreak} <span className="text-[11px] font-medium text-muted-foreground">day{currentStreak === 1 ? "" : "s"}</span>
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background/40 px-3 py-2.5 flex items-center gap-2.5">
              <Trophy size={16} className="text-accent-foreground" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Best</p>
                <p className="text-[15px] font-bold tabular-nums leading-tight">
                  {bestStreak} <span className="text-[11px] font-medium text-muted-foreground">day{bestStreak === 1 ? "" : "s"}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-stretch justify-between gap-2 h-36">
            {orderedDays.map((d) => {
              const ratio = d.total > 0 ? d.done / d.total : 0;
              const pct = Math.round(ratio * 100);
              const isFull = d.total > 0 && d.done >= d.total;
              const isPartial = d.done > 0 && !isFull;
              const isZero = d.total > 0 && d.done === 0;
              const noData = d.total === 0;
              const fillClass = isFull
                ? "bg-primary"
                : isPartial
                ? "bg-primary/55"
                : "bg-transparent";
              return (
                <div key={d.key} className="flex-1 flex flex-col items-center gap-2 h-full">
                  <div className={cn(
                    "relative flex-1 w-full max-w-[22px] mx-auto rounded-full overflow-hidden border",
                    d.isFromLastWeek ? "bg-muted/20 border-dashed border-border/40" : "bg-muted/40 border-border/50"
                  )}>
                    {d.done > 0 && (
                      <div
                        className={cn("absolute bottom-0 left-0 right-0 rounded-full transition-all", fillClass)}
                        style={{ height: `${Math.max(8, pct)}%` }}
                      />
                    )}
                    {isZero && (
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-destructive/40" />
                    )}
                    {noData && !d.isFromLastWeek && (
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase grid place-items-center w-5 h-5 rounded-full",
                      d.isToday
                        ? "bg-foreground text-background"
                        : "text-muted-foreground"
                    )}
                  >
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
