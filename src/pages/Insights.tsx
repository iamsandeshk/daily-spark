import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { useRoutines } from "@/hooks/useRoutines";
import { todayKey } from "@/lib/storage";
import { isPro } from "@/lib/pro";
import { cn } from "@/lib/utils";
import type { MoodValue } from "@/lib/routine-types";

const MOOD_LABEL: Record<MoodValue, { emoji: string; label: string }> = {
  great:    { emoji: "😄", label: "Great" },
  ok:       { emoji: "🙂", label: "Okay" },
  tired:    { emoji: "😴", label: "Tired" },
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
  }, [state.history]);

  // Weekday stats
  const weekdayStats = useMemo(() => {
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
  }, [state.history]);

  // Mood vs completion
  const moodStats = useMemo(() => {
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
  }, [state.history, state.moods]);

  const cellColor = (ratio: number, has: boolean) => {
    if (!has) return "bg-muted/40";
    if (ratio >= 1) return "bg-accent";
    if (ratio >= 0.66) return "bg-accent/70";
    if (ratio >= 0.33) return "bg-accent/40";
    return "bg-accent/20";
  };

  return (
    <div className="min-h-full bg-background pb-20 no-select">
      <header className="sticky top-0 z-30 bg-background safe-top px-5 pb-3 pt-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-serif font-bold">Insights</h1>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent/15 text-accent text-[10px] font-black uppercase tracking-wider px-2 py-1">
          <Crown size={10} /> Pro
        </span>
      </header>

      <main className="px-5 space-y-7">
        {!pro && (
          <div className="mt-2 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent p-4 flex items-center gap-3">
            <Sparkles size={18} className="text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold">Preview only</div>
              <div className="text-[12px] text-muted-foreground">Unlock full insights with Pro.</div>
            </div>
            <button
              onClick={() => navigate("/settings/pro")}
              className="h-8 px-3 rounded-full bg-accent text-accent-foreground text-[12px] font-bold"
            >
              Upgrade
            </button>
          </div>
        )}

        {/* Heatmap */}
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1 mb-2.5">
            Monthly heatmap
          </h2>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-block">
            <p className="text-[12px] text-muted-foreground mb-3">Last 12 weeks · darker = more complete</p>
            <div className="grid grid-flow-col auto-cols-fr grid-rows-7 gap-1">
              {heatmap.map((d) => (
                <div
                  key={d.key}
                  title={`${d.key} · ${Math.round(d.ratio * 100)}%`}
                  className={cn("aspect-square rounded-[3px]", cellColor(d.ratio, d.has))}
                />
              ))}
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-muted-foreground">
              <span>Less</span>
              <span className="h-2.5 w-2.5 rounded-[2px] bg-muted/40" />
              <span className="h-2.5 w-2.5 rounded-[2px] bg-accent/20" />
              <span className="h-2.5 w-2.5 rounded-[2px] bg-accent/40" />
              <span className="h-2.5 w-2.5 rounded-[2px] bg-accent/70" />
              <span className="h-2.5 w-2.5 rounded-[2px] bg-accent" />
              <span>More</span>
            </div>
          </div>
        </section>

        {/* Best / worst day */}
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1 mb-2.5">
            Best & worst days
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-success uppercase tracking-wider">
                <TrendingUp size={12} /> Best day
              </div>
              <div className="mt-2 text-2xl font-serif font-bold">
                {weekdayStats.best ? weekdayStats.best.label : "—"}
              </div>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                {weekdayStats.best ? `${Math.round(weekdayStats.best.avg * 100)}% avg` : "Not enough data"}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-destructive uppercase tracking-wider">
                <TrendingDown size={12} /> Toughest
              </div>
              <div className="mt-2 text-2xl font-serif font-bold">
                {weekdayStats.worst ? weekdayStats.worst.label : "—"}
              </div>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                {weekdayStats.worst ? `${Math.round(weekdayStats.worst.avg * 100)}% avg` : "Not enough data"}
              </div>
            </div>
          </div>

          {/* Weekday bars */}
          <div className="mt-3 rounded-2xl border border-border bg-card p-4">
            <div className="space-y-2.5">
              {weekdayStats.arr.map((w) => (
                <div key={w.dow} className="flex items-center gap-3">
                  <div className="w-9 text-[12px] font-bold text-muted-foreground">{w.label}</div>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${Math.round(w.avg * 100)}%` }}
                    />
                  </div>
                  <div className="w-10 text-right text-[12px] tabular-nums text-muted-foreground">
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
              Based on {Object.keys(state.moods ?? {}).length} mood entr{Object.keys(state.moods ?? {}).length === 1 ? "y" : "ies"}.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Insights;
