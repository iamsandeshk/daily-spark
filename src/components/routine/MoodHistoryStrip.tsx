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

const dayShort = (k: string) =>
  new Date(k + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1);

type Props = { state: RoutineState };

export const MoodHistoryStrip = ({ state }: Props) => {
  const days = useMemo(() => {
    const out: { key: string; mood?: MoodValue; isToday: boolean }[] = [];
    const today = todayKey();
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
  }, [state.moods]);

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
    </div>
  );
};
