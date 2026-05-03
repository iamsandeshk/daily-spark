import { useMemo } from "react";
import { motion } from "framer-motion";
import type { MoodValue, RoutineState } from "@/lib/routine-types";
import { todayKey } from "@/lib/storage";
import { cn } from "@/lib/utils";

const EMOJI: Record<MoodValue, string> = {
  great: "🙂",
  ok: "😐",
  tired: "😴",
  stressed: "😫",
};

const FEELING: Record<MoodValue, string> = {
  great: "happy",
  ok: "normal",
  tired: "tired",
  stressed: "stressed",
};

const dayShort = (k: string) =>
  new Date(k + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1);

type Props = { state: RoutineState };

export const MoodHistoryStrip = ({ state }: Props) => {
  const today = todayKey();

  const days = useMemo(() => {
    const out: { key: string; mood?: MoodValue; isToday: boolean }[] = [];
    const base = new Date(today + "T12:00:00");
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const k = todayKey(d);
      out.push({
        key: k,
        mood: state.moods?.[k],
        isToday: k === today,
      });
    }
    return out;
  }, [state.moods, today]);

  // Per-mood average completion ratio (counts partial completion) over the 7-day window.
  const insights = useMemo(() => {
    const buckets: Record<MoodValue, { sum: number; n: number }> = {
      great: { sum: 0, n: 0 },
      ok: { sum: 0, n: 0 },
      tired: { sum: 0, n: 0 },
      stressed: { sum: 0, n: 0 },
    };

    let overallSum = 0;
    let overallN = 0;

    for (const d of days) {
      if (!d.mood) continue;
      const h = state.history[d.key];
      if (!h || h.total === 0) continue;
      const ratio = Math.min(1, h.completedRoutineIds.length / h.total);
      buckets[d.mood].sum += ratio;
      buckets[d.mood].n += 1;
      overallSum += ratio;
      overallN += 1;
    }

    if (overallN < 2) return [];
    const overallAvg = overallSum / overallN;

    const order: MoodValue[] = ["great", "ok", "tired", "stressed"];
    const lines: { mood: MoodValue; text: string }[] = [];
    for (const mood of order) {
      const b = buckets[mood];
      if (b.n === 0) continue;
      const avg = b.sum / b.n;
      const diff = avg - overallAvg;
      let phrase: string;
      if (Math.abs(diff) < 0.08) phrase = "did about the same amount of work";
      else if (diff > 0) phrase = "did more tasks";
      else phrase = "did less work";
      lines.push({
        mood,
        text: `You ${phrase} when you felt ${FEELING[mood]}.`,
      });
    }
    return lines;
  }, [days, state.history]);

  const hasAny = days.some((d) => d.mood);
  if (!hasAny) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-block">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium">
        Mood · last 7 days
      </p>
      <div className="mt-3 flex items-end justify-between gap-1">
        {days.map((d, i) => (
          <motion.div
            key={d.key}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.25 }}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <div
              className={cn(
                "h-9 w-9 grid place-items-center rounded-xl text-lg leading-none transition-colors",
                d.mood ? "bg-muted/60" : "bg-muted/20 text-muted-foreground/30",
                d.isToday && "ring-2 ring-foreground ring-offset-1 ring-offset-card",
              )}
            >
              {d.mood ? EMOJI[d.mood] : "·"}
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-[0.1em]",
                d.isToday ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {dayShort(d.key)}
            </span>
          </motion.div>
        ))}
      </div>

      {insights.length > 0 && (
        <div className="mt-4 space-y-1.5 border-t border-border pt-3">
          {insights.map((line) => (
            <div key={line.mood} className="flex items-start gap-2">
              <span className="text-sm leading-5 shrink-0">{EMOJI[line.mood]}</span>
              <p className="text-[12.5px] leading-5 text-foreground/80">{line.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
