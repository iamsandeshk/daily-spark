import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { RoutineState } from "@/lib/routine-types";
import { todayKey } from "@/lib/storage";
import { tapHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type Props = {
  state: RoutineState;
  onSelectDate?: (dateKey: string) => void;
};

export const WeekStrip = ({ state, onSelectDate }: Props) => {
  const navigate = useNavigate();
  const today = todayKey();
  const startOfWeek = (state.settings?.startOfWeek ?? 1) as 0 | 1; // Default 1 = Monday

  // Generate the 7 days of the current week surrounding today
  const days = useMemo(() => {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 is Sunday
    // Offset to start of the week
    const diff = (currentDayOfWeek - startOfWeek + 7) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - diff);

    const weekDays: Array<{
      dateKey: string;
      dayNumber: number;
      dayLetter: string;
      isToday: boolean;
      isFuture: boolean;
      status: "completed" | "partial" | "empty" | "future";
      completionRate: number;
    }> = [];

    const weekdaysLetters = ["S", "M", "T", "W", "T", "F", "S"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const k = todayKey(d);
      const isToday = k === today;
      const isFuture = k > today;

      let status: "completed" | "partial" | "empty" | "future" = "empty";
      let completionRate = 0;

      if (isFuture) {
        status = "future";
      } else if (isToday) {
        // Today's real-time completion
        const activeRoutines = state.routines.filter((r) => !r.archived);
        const total = activeRoutines.length;
        const completed = activeRoutines.filter((r) => r.isCompleted).length;
        completionRate = total > 0 ? completed / total : 0;
        if (total > 0 && completed === total) status = "completed";
        else if (completed > 0) status = "partial";
      } else {
        const hist = state.history[k];
        if (hist && hist.total > 0) {
          completionRate = hist.completedRoutineIds.length / hist.total;
          if (hist.completedRoutineIds.length >= hist.total) status = "completed";
          else if (hist.completedRoutineIds.length > 0) status = "partial";
        }
      }

      weekDays.push({
        dateKey: k,
        dayNumber: d.getDate(),
        dayLetter: weekdaysLetters[d.getDay()],
        isToday,
        isFuture,
        status,
        completionRate,
      });
    }

    return weekDays;
  }, [state.settings?.startOfWeek, state.history, state.routines, today, startOfWeek]);

  const handleDayClick = (day: (typeof days)[0]) => {
    tapHaptic();
    if (day.isToday) return;
    if (onSelectDate) {
      onSelectDate(day.dateKey);
    } else {
      navigate("/history");
    }
  };

  return (
    <div className="px-5 pt-1 pb-3">
      <div className="grid grid-cols-7 gap-1 p-1.5 rounded-2xl bg-card border border-border shadow-sm">
        {days.map((day) => (
          <button
            key={day.dateKey}
            type="button"
            onClick={() => handleDayClick(day)}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-0.5 rounded-xl transition-all duration-150 select-none",
              day.isToday
                ? "bg-accent text-accent-foreground font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
            aria-label={`${day.dateKey} - ${day.status}`}
          >
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider mb-0.5",
                day.isToday ? "text-accent-foreground/90" : "text-muted-foreground/70",
              )}
            >
              {day.dayLetter}
            </span>
            <span
              className={cn(
                "text-[13px] font-semibold tabular-nums leading-tight",
                day.isToday && "text-accent-foreground font-bold",
              )}
            >
              {day.dayNumber}
            </span>

            {/* Subtle status indicator dot */}
            <div className="mt-1 h-1.5 flex items-center justify-center">
              {day.isToday ? (
                <span className="h-1 w-1 rounded-full bg-accent-foreground" />
              ) : day.status === "completed" ? (
                <span className="h-1 w-1 rounded-full bg-accent" />
              ) : day.status === "partial" ? (
                <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
              ) : (
                <span className="h-1 w-1 rounded-full bg-transparent" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
