import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, ChevronLeft, ChevronRight, ChevronDown, Settings, Lock, Sparkles, Check, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRoutines } from "@/hooks/useRoutines";
import { todayKey, yesterdayKey } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { isPro } from "@/lib/pro";
import { tapHaptic } from "@/lib/haptics";
import { MoodHistoryStrip } from "@/components/routine/MoodHistoryStrip";

const monthLabel = (d: Date) => d.toLocaleDateString(undefined, { month: "long", year: "numeric" });

/**
 * Current streak = consecutive days (ending today, or yesterday if today isn't perfect yet)
 * where the day had at least one routine AND every routine was completed.
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

/**
 * Longest streak from historical records
 */
const computeLongestStreak = (
  history: Record<string, { completedRoutineIds: string[]; total: number }>,
  currentStreak: number,
) => {
  const dates = Object.keys(history)
    .filter((k) => {
      const d = history[k];
      return d && d.total > 0 && d.completedRoutineIds.length >= d.total;
    })
    .sort();

  if (dates.length === 0) return currentStreak;

  let maxStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1] + "T12:00:00");
    const currDate = new Date(dates[i] + "T12:00:00");
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      currentRun++;
      if (currentRun > maxStreak) maxStreak = currentRun;
    } else {
      currentRun = 1;
    }
  }
  return Math.max(maxStreak, currentStreak);
};

const History = () => {
  const navigate = useNavigate();
  const { state } = useRoutines();
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string>(todayKey());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  const toggleExpand = (rid: string) => {
    tapHaptic();
    setExpanded((prev) => ({ ...prev, [rid]: !prev[rid] }));
  };

  const changeMonth = (delta: number) => {
    // Viewing previous months is a Pro feature
    if (delta < 0 && !isPro()) {
      const now = new Date();
      const target = new Date(year, month + delta, 1);
      const isPastMonth =
        target.getFullYear() < now.getFullYear() ||
        (target.getFullYear() === now.getFullYear() && target.getMonth() < now.getMonth());
      if (isPastMonth) {
        toast("Viewing previous months is a Pro feature", {
          description: "Upgrade to Pro to browse your full history.",
          action: { label: "Get Pro", onClick: () => navigate("/settings/pro") },
        });
        return;
      }
    }
    tapHaptic();
    setDirection(delta > 0 ? "right" : "left");
    setCursor(new Date(year, month + delta, 1));
  };

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayK = todayKey();

  const startOfWeek = (state.settings?.startOfWeek ?? 1) as 0 | 1;
  const startWeekday = (firstDay.getDay() - startOfWeek + 7) % 7;

  const cells = useMemo(() => {
    const arr: Array<{ key: string | null; day: number | null }> = [];
    for (let i = 0; i < startWeekday; i++) arr.push({ key: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = todayKey(new Date(year, month, d));
      arr.push({ key, day: d });
    }
    return arr;
  }, [year, month, daysInMonth, startWeekday, startOfWeek]);

  const streak = useMemo(() => computeStreak(state.history), [state.history]);
  const bestStreak = useMemo(
    () => computeLongestStreak(state.history, streak),
    [state.history, streak],
  );

  const dayInfo = (key: string) => {
    const h = state.history[key];
    if (!h || h.total === 0) return { ratio: 0, full: false, has: false };
    const ratio = h.completedRoutineIds.length / h.total;
    return { ratio, full: ratio >= 1, has: true };
  };

  const selectedDay = state.history[selected];
  const selectedMood = state.moods?.[selected];

  return (
    <div className="min-h-full bg-background pb-28 no-select">
      <header className="safe-top sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => navigate("/")}
            className="h-9 w-9 rounded-full bg-muted/40 border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-bold text-foreground">History & Streaks</h1>
          <button
            onClick={() => navigate("/settings")}
            className="h-9 w-9 rounded-full bg-muted/40 border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth active:scale-95"
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      <main className="px-5 pt-5 space-y-5">
        {/* Streak Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-1.5 text-accent">
              <Flame size={15} strokeWidth={2.5} className="fill-accent/20" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Current Streak
              </span>
            </div>
            <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight text-foreground flex items-baseline gap-1">
              {streak}
              <span className="text-xs font-semibold text-muted-foreground">days</span>
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-1.5 text-amber-500">
              <Trophy size={14} strokeWidth={2.5} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Best Streak
              </span>
            </div>
            <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight text-foreground flex items-baseline gap-1">
              {bestStreak}
              <span className="text-xs font-semibold text-muted-foreground">days</span>
            </p>
          </div>
        </div>

        {/* Mood History Strip */}
        <MoodHistoryStrip state={state} />

        {/* Calendar Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          {/* Month Navigation Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => changeMonth(-1)}
              className="relative h-8 w-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
              {!isPro() && (
                <Lock size={9} strokeWidth={3} className="absolute -top-1 -right-1 text-accent bg-card rounded-full" />
              )}
            </button>
            <p className="text-sm font-bold tracking-tight text-foreground">{monthLabel(cursor)}</p>
            <button
              onClick={() => changeMonth(1)}
              className="h-8 w-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Month Days Grid */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`${year}-${month}`}
              custom={direction}
              initial={{ opacity: 0, x: direction === "right" ? 20 : direction === "left" ? -20 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction === "right" ? -20 : direction === "left" ? 20 : 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x > 50) changeMonth(-1);
                else if (info.offset.x < -50) changeMonth(1);
              }}
              className="touch-pan-y"
            >
              <div className="grid grid-cols-7 gap-1.5 mb-2.5">
                {(startOfWeek === 1
                  ? ["M", "T", "W", "T", "F", "S", "S"]
                  : ["S", "M", "T", "W", "T", "F", "S"]
                ).map((d, i) => {
                  const isSunday = startOfWeek === 1 ? i === 6 : i === 0;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "text-center text-[10px] font-bold uppercase tracking-wider",
                        isSunday ? "text-destructive/80" : "text-muted-foreground/70",
                      )}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
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
                      onClick={() => {
                        tapHaptic();
                        setSelected(c.key!);
                      }}
                      className={cn(
                        "aspect-square rounded-xl text-xs font-semibold relative flex items-center justify-center transition-all duration-200 select-none active:scale-90",
                        isFuture && "opacity-25",
                        !isSelected && !info.full && !info.has && "hover:bg-muted/60 text-muted-foreground",
                        info.full && "bg-emerald-500 text-white font-bold shadow-[0_0_8px_rgba(16,185,129,0.4)]",
                        info.has && !info.full && "bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30",
                        isSelected && "ring-2 ring-accent ring-offset-2 ring-offset-card font-extrabold",
                        isToday && !info.full && "border-2 border-accent text-accent font-bold",
                      )}
                    >
                      {c.day}
                      {info.full && (
                        <Flame
                          size={10}
                          strokeWidth={2.5}
                          className="absolute -top-1 -right-1 text-white fill-white/40 drop-shadow-xs"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Calendar Legend */}
          <div className="flex items-center justify-between pt-4 mt-3 border-t border-border/40 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" /> Partial
            </span>
            <span className="flex items-center gap-1.5">
              <Flame size={12} className="text-accent" /> Perfect day
            </span>
          </div>
        </div>

        {/* Selected Day Details Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold">
                Daily Breakdown
              </p>
              <h2 className="text-base font-bold text-foreground mt-0.5">
                {new Date(selected + "T12:00:00").toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
            </div>

            {selectedMood && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent capitalize">
                Mood: {selectedMood}
              </span>
            )}
          </div>

          {!selectedDay || selectedDay.total === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 p-6 text-center">
              <p className="text-xs text-muted-foreground">No routine records found for this date.</p>
            </div>
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
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background/60 border border-border/60">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold tabular-nums text-foreground">
                        {completed.length}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold">
                        of {selectedDay.total} routines finished
                      </span>
                    </div>
                    {perfect ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
                        <Flame size={12} strokeWidth={2.5} /> Perfect Day
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                        {Math.round(ratio * 100)}% complete
                      </span>
                    )}
                  </div>

                  {/* Completed Routines List */}
                  {completed.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                        Completed Routines ({completed.length})
                      </p>
                      <div className="space-y-2">
                        {completed.map(([rid, snap]) => {
                          const isExp = !!expanded[rid];
                          const tasks = (snap.blocks ?? []).filter(
                            (b) => b.type === "checkbox" && b.text?.trim(),
                          );

                          return (
                            <div
                              key={rid}
                              className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden transition-all"
                            >
                              <button
                                onClick={() => toggleExpand(rid)}
                                className="w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-emerald-500/10"
                              >
                                <span className="h-5 w-5 rounded-md bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0 font-bold">
                                  <Check size={12} strokeWidth={3} />
                                </span>
                                <span className="text-base shrink-0 leading-none">
                                  {snap.emoji || "✨"}
                                </span>
                                <span className="flex-1 truncate text-sm font-semibold text-foreground">
                                  {snap.title}
                                </span>
                                <motion.span
                                  animate={{ rotate: isExp ? 180 : 0 }}
                                  className="text-muted-foreground shrink-0"
                                >
                                  <ChevronDown size={14} />
                                </motion.span>
                              </button>

                              <AnimatePresence>
                                {isExp && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden bg-background/40 border-t border-emerald-500/15"
                                  >
                                    <div className="px-4 py-2.5 space-y-1.5">
                                      {tasks.length === 0 ? (
                                        <p className="text-xs text-muted-foreground italic">
                                          Routine was marked complete.
                                        </p>
                                      ) : (
                                        tasks.map((t) => (
                                          <div
                                            key={t.id}
                                            className="flex items-center gap-2 text-xs text-foreground/85"
                                          >
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                            <span
                                              className={cn(
                                                t.checked && "line-through text-muted-foreground/60",
                                              )}
                                            >
                                              {t.text}
                                            </span>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Missed Routines List */}
                  {missed.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                        Incomplete Routines ({missed.length})
                      </p>
                      <div className="space-y-2">
                        {missed.map(([rid, snap]) => {
                          const isExp = !!expanded[rid];
                          const tasks = (snap.blocks ?? []).filter(
                            (b) => b.type === "checkbox" && b.text?.trim(),
                          );

                          return (
                            <div
                              key={rid}
                              className="rounded-xl border border-border/70 bg-muted/20 overflow-hidden"
                            >
                              <button
                                onClick={() => toggleExpand(rid)}
                                className="w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/40"
                              >
                                <span className="h-5 w-5 rounded-md border border-border bg-background flex items-center justify-center shrink-0">
                                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                                </span>
                                <span className="text-base shrink-0 leading-none">
                                  {snap.emoji || "✨"}
                                </span>
                                <span className="flex-1 truncate text-sm font-medium text-muted-foreground">
                                  {snap.title}
                                </span>
                                <motion.span
                                  animate={{ rotate: isExp ? 180 : 0 }}
                                  className="text-muted-foreground/60 shrink-0"
                                >
                                  <ChevronDown size={14} />
                                </motion.span>
                              </button>

                              <AnimatePresence>
                                {isExp && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden bg-background/30 border-t border-border/40"
                                  >
                                    <div className="px-4 py-2.5 space-y-1.5">
                                      {tasks.length === 0 ? (
                                        <p className="text-xs text-muted-foreground italic">
                                          No tasks recorded for this routine.
                                        </p>
                                      ) : (
                                        tasks.map((t) => (
                                          <div
                                            key={t.id}
                                            className="flex items-center gap-2 text-xs text-muted-foreground"
                                          >
                                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                                            <span
                                              className={cn(t.checked && "line-through opacity-70")}
                                            >
                                              {t.text}
                                            </span>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
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
