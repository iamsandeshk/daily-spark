import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { useRoutines } from "@/hooks/useRoutines";
import { todayKey } from "@/lib/storage";
import { isPro } from "@/lib/pro";
import { cn } from "@/lib/utils";
import type { MoodValue } from "@/lib/routine-types";

const MOOD_LABEL: Record<MoodValue, { emoji: string; label: string }> = {
  great: { emoji: "😄", label: "Great" },
  ok: { emoji: "🙂", label: "Okay" },
  tired: { emoji: "😴", label: "Tired" },
  stressed: { emoji: "😣", label: "Stressed" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Insights = () => {
  const navigate = useNavigate();
  const { state } = useRoutines();
  const [pro, setProState] = useState(isPro());

  useEffect(() => {
    const onUpdate = () => setProState(isPro());
    window.addEventListener("pro:updated", onUpdate);
    return () => window.removeEventListener("pro:updated", onUpdate);
  }, []);

  // Build last ~12 weeks (84 days) heatmap data.
  const heatmap = useMemo(() => {
    if (!pro) {
      const days: { key: string; ratio: number; has: boolean }[] = [];
      const totalDays = 12 * 7;
      for (let i = 0; i < totalDays; i++) {
        const seed = i * 17 + 5;
        const has = (seed % 10) > 1; // 80% filled
        const ratio = has ? (0.2 + (seed % 7) * 0.12) : 0;
        days.push({
          key: `fake-${i}`,
          ratio,
          has
        });
      }
      return days;
    }

    const days: { key: string; ratio: number; has: boolean }[] = [];
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const end = new Date(today);
    // align end to Saturday so weeks line up
    const offsetToSat = 6 - end.getDay();
    end.setDate(end.getDate() + offsetToSat);
    const totalDays = 12 * 7;
    const start = new Date(end);
    start.setDate(start.getDate() - totalDays + 1);

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const k = todayKey(d);
      const h = state.history[k];
      const isFuture = k > todayKey();
      if (isFuture || !h || h.total === 0) {
        days.push({ key: k, ratio: 0, has: false });
      } else {
        days.push({ key: k, ratio: h.completedRoutineIds.length / h.total, has: true });
      }
    }
    return days;
  }, [state.history, pro]);

  // Weekday stats
  const weekdayStats = useMemo(() => {
    if (!pro) {
      const arr = [
        { dow: 0, label: "Sun", avg: 0.65, count: 8 },
        { dow: 1, label: "Mon", avg: 0.42, count: 8 },
        { dow: 2, label: "Tue", avg: 0.72, count: 8 },
        { dow: 3, label: "Wed", avg: 0.85, count: 8 },
        { dow: 4, label: "Thu", avg: 0.90, count: 8 },
        { dow: 5, label: "Fri", avg: 0.78, count: 8 },
        { dow: 6, label: "Sat", avg: 0.55, count: 8 },
      ];
      return {
        arr,
        best: arr[4], // Thu
        worst: arr[1], // Mon
      };
    }

    const buckets: { sum: number; count: number }[] = Array.from({ length: 7 }, () => ({ sum: 0, count: 0 }));
    for (const k of Object.keys(state.history)) {
      const h = state.history[k];
      if (!h || h.total === 0) continue;
      const dow = new Date(k + "T12:00:00").getDay();
      buckets[dow].sum += h.completedRoutineIds.length / h.total;
      buckets[dow].count += 1;
    }
    const arr = buckets.map((b, i) => ({
      dow: i,
      label: WEEKDAYS[i],
      avg: b.count ? b.sum / b.count : 0,
      count: b.count,
    }));
    const tracked = arr.filter((a) => a.count > 0);
    const best = tracked.length ? tracked.reduce((a, b) => (b.avg > a.avg ? b : a)) : null;
    const worst = tracked.length ? tracked.reduce((a, b) => (b.avg < a.avg ? b : a)) : null;
    return { arr, best, worst };
  }, [state.history, pro]);

  // Mood vs completion
  const moodStats = useMemo(() => {
    if (!pro) {
      return [
        { mood: "great" as MoodValue, avg: 0.88, count: 10 },
        { mood: "ok" as MoodValue, avg: 0.68, count: 12 },
        { mood: "tired" as MoodValue, avg: 0.35, count: 8 },
        { mood: "stressed" as MoodValue, avg: 0.22, count: 5 },
      ];
    }

    const moods = state.moods ?? {};
    const buckets: Record<MoodValue, { sum: number; count: number }> = {
      great: { sum: 0, count: 0 },
      ok: { sum: 0, count: 0 },
      tired: { sum: 0, count: 0 },
      stressed: { sum: 0, count: 0 },
    };
    for (const [date, mood] of Object.entries(moods)) {
      const h = state.history[date];
      if (!h || h.total === 0) continue;
      buckets[mood as MoodValue].sum += h.completedRoutineIds.length / h.total;
      buckets[mood as MoodValue].count += 1;
    }
    return (["great", "ok", "tired", "stressed"] as MoodValue[]).map((m) => ({
      mood: m,
      avg: buckets[m].count ? buckets[m].sum / buckets[m].count : 0,
      count: buckets[m].count,
    }));
  }, [state.history, state.moods, pro]);

  const cellColor = (ratio: number, has: boolean) => {
    if (!has) return "bg-muted/40";
    if (ratio >= 1) return "bg-accent shadow-[0_0_6px_hsl(var(--accent)/0.5)]";
    if (ratio >= 0.66) return "bg-accent/75";
    if (ratio >= 0.33) return "bg-accent/45";
    return "bg-accent/25";
  };

  return (
    <div className="min-h-full bg-background pb-24 no-select">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md safe-top px-5 pb-3 pt-3 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full border border-border/70 p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Insights & Trends</h1>
            <p className="text-xs text-muted-foreground font-medium">Routine analytics and habits</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 text-accent text-[11px] font-black uppercase tracking-wider px-2.5 py-1 border border-accent/20">
          <Crown size={11} /> Pro
        </span>
      </header>

      <main className="px-5 pt-4 space-y-6">
        {!pro && (
          <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent p-4 flex items-center gap-3 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-accent/20 flex items-center justify-center shrink-0 text-accent">
              <Sparkles size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-foreground">Preview Analytics</div>
              <div className="text-xs text-muted-foreground">Unlock live personal history with Pro.</div>
            </div>
            <button
              onClick={() => navigate("/settings/pro")}
              className="h-8 px-3.5 rounded-full bg-accent text-accent-foreground text-xs font-bold shadow-sm hover:brightness-105 active:scale-95 transition-all"
            >
              Upgrade
            </button>
          </div>
        )}

        {/* Heatmap */}
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1 mb-2.5">
            Consistency Heatmap
          </h2>
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground mb-3 font-medium">Last 12 weeks · Darker = more complete</p>
            <div className="grid grid-flow-col auto-cols-fr grid-rows-7 gap-1">
              {heatmap.map((d) => (
                <div
                  key={d.key}
                  title={`${d.key} · ${Math.round(d.ratio * 100)}%`}
                  className={cn("aspect-square rounded-[4px] transition-colors", cellColor(d.ratio, d.has))}
                />
              ))}
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-3.5 text-[10px] text-muted-foreground font-medium">
              <span>Less</span>
              <span className="h-2.5 w-2.5 rounded-[3px] bg-muted/40" />
              <span className="h-2.5 w-2.5 rounded-[3px] bg-accent/25" />
              <span className="h-2.5 w-2.5 rounded-[3px] bg-accent/45" />
              <span className="h-2.5 w-2.5 rounded-[3px] bg-accent/75" />
              <span className="h-2.5 w-2.5 rounded-[3px] bg-accent" />
              <span>More</span>
            </div>
          </div>
        </section>

        {/* Best / worst day */}
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1 mb-2.5">
            Weekday Performance
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-500 uppercase tracking-wider">
                <TrendingUp size={13} /> Best day
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {weekdayStats.best ? weekdayStats.best.label : "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                {weekdayStats.best ? `${Math.round(weekdayStats.best.avg * 100)}% completion` : "Not enough data"}
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-destructive uppercase tracking-wider">
                <TrendingDown size={13} /> Toughest day
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {weekdayStats.worst ? weekdayStats.worst.label : "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                {weekdayStats.worst ? `${Math.round(weekdayStats.worst.avg * 100)}% completion` : "Not enough data"}
              </div>
            </div>
          </div>

          {/* Weekday bars */}
          <div className="mt-3 rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="space-y-3">
              {weekdayStats.arr.map((w) => (
                <div key={w.dow} className="flex items-center gap-3">
                  <div className="w-10 text-xs font-bold text-muted-foreground">{w.label}</div>
                  <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${Math.round(w.avg * 100)}%` }}
                    />
                  </div>
                  <div className="w-10 text-right text-xs font-semibold tabular-nums text-foreground">
                    {w.count ? `${Math.round(w.avg * 100)}%` : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mood vs completion */}
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1 mb-2.5">
            Mood vs completion
          </h2>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[12px] text-muted-foreground mb-3">
              How your mood correlates with how much you got done.
            </p>
            <div className="space-y-3">
              {moodStats.map((m) => (
                <div key={m.mood} className="flex items-center gap-3">
                  <div className="w-9 text-xl text-center">{MOOD_LABEL[m.mood].emoji}</div>
                  <div className="w-16 text-[12px] font-semibold">{MOOD_LABEL[m.mood].label}</div>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${Math.round(m.avg * 100)}%` }}
                    />
                  </div>
                  <div className="w-14 text-right text-[12px] tabular-nums text-muted-foreground">
                    {m.count ? `${Math.round(m.avg * 100)}%` : "—"}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              {pro 
                ? `Based on ${Object.keys(state.moods ?? {}).length} mood entr${Object.keys(state.moods ?? {}).length === 1 ? "y" : "ies"}.`
                : "Based on 35 mock mood entries (Preview only)"}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Insights;
