import { useMemo } from "react";
import { Check, Flame, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Routine, RoutineState } from "@/lib/routine-types";
import { todayKey } from "@/lib/storage";
import { getRoutineColor } from "@/lib/routine-colors";
import { tapHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type Props = {
  routines: Routine[];
  state: RoutineState;
};

export const WeekViewGrid = ({ routines, state }: Props) => {
  const navigate = useNavigate();
  const today = todayKey();
  const startOfWeek = (state.settings?.startOfWeek ?? 1) as 0 | 1;

  // Compute 7 days of the current week
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const diff = (currentDayOfWeek - startOfWeek + 7) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - diff);

    const weekdaysLetters = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const arr: Array<{ key: string; date: Date; label: string; isToday: boolean; isFuture: boolean }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const k = todayKey(d);
      arr.push({
        key: k,
        date: d,
        label: weekdaysLetters[d.getDay()],
        isToday: k === today,
        isFuture: k > today,
      });
    }
    return arr;
  }, [startOfWeek, today]);

  return (
    <div className="space-y-4 px-1">
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Weekly Consistency</h3>
            <p className="text-xs text-muted-foreground">Routine completion across 7 days</p>
          </div>
          <button
            onClick={() => {
              tapHaptic();
              navigate("/insights");
            }}
            className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            Insights
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-[1.5fr_repeat(7,1fr)] gap-1 pt-3 pb-2 text-center items-center">
          <div className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 pl-1">
            Routine
          </div>
          {weekDays.map((d) => (
            <div
              key={d.key}
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider py-1 rounded-md",
                d.isToday ? "text-accent font-extrabold bg-accent/10" : "text-muted-foreground/70",
              )}
            >
              {d.label.slice(0, 1)}
            </div>
          ))}
        </div>

        {/* Routines Rows */}
        <div className="divide-y divide-border/40">
          {routines.map((routine) => {
            const color = getRoutineColor(routine);
            let weekCompletedCount = 0;

            const daysStatus = weekDays.map((d) => {
              if (d.isFuture) return { ...d, done: false, status: "future" as const };

              let isDone = false;
              if (d.isToday) {
                const allBlocks = (routine.blocks ?? []).filter(
                  (b) => (b.type === "checkbox" || b.type === "timer") && b.text?.trim(),
                );
                isDone =
                  routine.isCompleted || (allBlocks.length > 0 && allBlocks.every((b) => b.checked));
              } else {
                const hist = state.history[d.key];
                isDone = !!hist?.completedRoutineIds?.includes(routine.id);
              }

              if (isDone) weekCompletedCount++;
              return { ...d, done: isDone, status: isDone ? ("done" as const) : ("missed" as const) };
            });

            return (
              <div
                key={routine.id}
                className="grid grid-cols-[1.5fr_repeat(7,1fr)] gap-1 py-3 items-center"
              >
                {/* Routine info */}
                <button
                  type="button"
                  onClick={() => {
                    tapHaptic();
                    navigate(`/routine/${routine.id}`);
                  }}
                  className="flex items-center gap-2 text-left min-w-0 pr-1 group select-none"
                >
                  <span className="text-base shrink-0 leading-none">{routine.emoji || "✨"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                      {routine.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {weekCompletedCount}/7 days
                    </span>
                  </div>
                </button>

                {/* 7 Day checks */}
                {daysStatus.map((d) => (
                  <div key={d.key} className="flex items-center justify-center">
                    {d.status === "future" ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/15" />
                    ) : d.done ? (
                      <div
                        className="h-6 w-6 rounded-lg flex items-center justify-center text-white shadow-xs"
                        style={{
                          backgroundColor: color.hex,
                        }}
                      >
                        <Check size={13} strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-center">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
