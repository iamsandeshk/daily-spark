import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { MoodValue, RoutineState } from "@/lib/routine-types";
import { todayKey } from "@/lib/storage";
import { tapHaptic, successHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type Props = {
  state: RoutineState;
  onSelectMood: (mood: MoodValue) => void;
};

const MOODS: { value: MoodValue; emoji: string; label: string }[] = [
  { value: "great", emoji: "🙂", label: "Great" },
  { value: "ok", emoji: "😐", label: "OK" },
  { value: "tired", emoji: "😴", label: "Tired" },
  { value: "stressed", emoji: "😫", label: "Stressed" },
];

const SESSION_DISMISS_KEY = "mood-card-dismissed-date";

/**
 * Computes a weekly insight comparing routine completion across mood values.
 * Returns a friendly string when there are at least 4 mood entries in last 14 days.
 */
const computeMoodInsight = (state: RoutineState): string | null => {
  const moods = state.moods ?? {};
  const entries = Object.entries(moods).slice(-14);
  if (entries.length < 4) return null;

  // Map each dated mood → completion ratio for that day
  const buckets: Record<MoodValue, { sum: number; n: number }> = {
    great: { sum: 0, n: 0 },
    ok: { sum: 0, n: 0 },
    tired: { sum: 0, n: 0 },
    stressed: { sum: 0, n: 0 },
  };

  for (const [date, mood] of entries) {
    const h = state.history[date];
    if (!h || h.total === 0) continue;
    const ratio = h.completedRoutineIds.length / h.total;
    buckets[mood as MoodValue].sum += ratio;
    buckets[mood as MoodValue].n += 1;
  }

  const ratios = (Object.entries(buckets) as [MoodValue, { sum: number; n: number }][])
    .filter(([, v]) => v.n >= 1)
    .map(([k, v]) => ({ mood: k, avg: v.sum / v.n }));

  if (ratios.length < 2) return null;

  ratios.sort((a, b) => b.avg - a.avg);
  const best = ratios[0];
  const worst = ratios[ratios.length - 1];
  if (best.avg - worst.avg < 0.15) return null;

  const label = MOODS.find((m) => m.value === best.mood)?.label.toLowerCase() ?? best.mood;
  return `You complete more when you feel ${label}.`;
};

export const MoodCard = ({ state, onSelectMood }: Props) => {
  const today = todayKey();
  const todaysMood = state.moods?.[today];

  // Dismiss state for the day (persisted in sessionStorage so it doesn't reappear on nav)
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(SESSION_DISMISS_KEY) === today;
  });

  const insight = useMemo(() => computeMoodInsight(state), [state]);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_DISMISS_KEY, today);
    setDismissed(true);
    tapHaptic();
  };

  const handlePick = (mood: MoodValue) => {
    successHaptic();
    onSelectMood(mood);
  };

  // If user already logged a mood today, show a compact line with optional insight.
  if (todaysMood) {
    if (!insight) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-5 mb-4 flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2"
      >
        <Sparkles size={14} className="text-accent shrink-0" strokeWidth={2.5} />
        <p className="text-[13px] text-foreground/80 leading-snug">{insight}</p>
      </motion.div>
    );
  }

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="mood-card"
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div className="mx-5 mb-5 rounded-2xl border border-border bg-card p-4 shadow-block relative">
          <button
            onClick={handleDismiss}
            className="absolute top-2.5 right-2.5 h-7 w-7 grid place-items-center rounded-full text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>

          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium">
            Quick check-in
          </p>
          <h3 className="mt-1 text-[17px] font-semibold tracking-tight">How do you feel?</h3>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => handlePick(m.value)}
                className={cn(
                  "flex flex-col items-center gap-2 py-3 px-1 transition-all rounded-2xl",
                  "hover:bg-muted/50 hover:scale-110 active:scale-90",
                )}
              >
                <span className="text-3xl leading-none">{m.emoji}</span>
                <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-[0.1em]">
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          {insight && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-accent/5 border border-accent/15 px-2.5 py-1.5">
              <Sparkles size={12} className="text-accent shrink-0" strokeWidth={2.5} />
              <p className="text-[12px] text-foreground/80 leading-snug">{insight}</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
