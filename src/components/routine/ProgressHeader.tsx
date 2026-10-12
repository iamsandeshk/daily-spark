import { motion } from "framer-motion";
import { GripVertical, Settings, Flame, Crown, BarChart2, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { applyTheme, getThemeMode, getAmoled } from "@/lib/theme";
import { isPro } from "@/lib/pro";
import { tapHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type Props = {
  completed: number;
  total: number;
  onOpenHistory?: () => void;
  reorderActive?: boolean;
  onToggleReorder?: () => void;
  globalStreak?: number;
  viewMode?: "today" | "week";
  onViewModeChange?: (mode: "today" | "week") => void;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const dateLabel = () =>
  new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

// Apply persisted theme on mount and watch system changes when mode === system.
const useThemeBootstrap = () => {
  useEffect(() => {
    applyTheme(getThemeMode(), getAmoled());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (getThemeMode() === "system") applyTheme("system", getAmoled());
    };
    mq.addEventListener("change", handler);
    const onStorage = () => applyTheme(getThemeMode(), getAmoled());
    window.addEventListener("storage", onStorage);
    return () => {
      mq.removeEventListener("change", handler);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
};

export const ProgressHeader = ({
  completed,
  total,
  reorderActive,
  onToggleReorder,
  globalStreak = 0,
  viewMode = "today",
  onViewModeChange,
}: Props) => {
  useThemeBootstrap();
  const navigate = useNavigate();
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const [proActive, setProActive] = useState(() => isPro());

  useEffect(() => {
    const handleProChange = () => {
      setProActive(isPro());
    };
    window.addEventListener("pro:updated", handleProChange);
    window.addEventListener("storage", handleProChange);
    return () => {
      window.removeEventListener("pro:updated", handleProChange);
      window.removeEventListener("storage", handleProChange);
    };
  }, []);

  const getProgressStatus = () => {
    if (total === 0) return "No routines scheduled";
    if (completed === total) return "All tasks completed today";
    const remaining = total - completed;
    return `${remaining} ${remaining === 1 ? "task" : "tasks"} remaining`;
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm safe-top px-5 pb-3">
        <div className="flex items-center justify-between w-full pt-1">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-semibold">
              {dateLabel()}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
              {greeting()}
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            {!proActive && (
              <button
                onClick={() => {
                  tapHaptic();
                  navigate("/settings/pro");
                }}
                className="flex items-center h-8 gap-1 rounded-full bg-accent px-2.5 text-[11px] font-bold text-accent-foreground active:scale-95 transition-transform shrink-0"
                aria-label="Upgrade to Pro"
              >
                <Crown size={12} />
                PRO
              </button>
            )}

            {/* Streak flame badge */}
            <div
              className="flex items-center h-8 gap-1 rounded-full bg-accent/10 border border-accent/20 px-2.5 text-xs font-bold text-accent shrink-0"
              title={`${globalStreak} day streak`}
            >
              <Flame size={13} className="fill-accent/20" />
              <span>{globalStreak}</span>
            </div>

            {/* Calendar / History button */}
            <button
              onClick={() => {
                tapHaptic();
                navigate("/history");
              }}
              className="h-8 w-8 rounded-full border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0 active:scale-95"
              aria-label="Calendar History"
            >
              <CalendarDays size={15} />
            </button>

            {onToggleReorder && (
              <button
                onClick={onToggleReorder}
                className={cn(
                  "h-8 w-8 rounded-full border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 active:scale-95",
                  reorderActive
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border/80 hover:bg-muted/50",
                )}
                aria-label="Toggle section reorder"
                aria-pressed={reorderActive}
              >
                <GripVertical size={15} />
              </button>
            )}

            {/* Settings button */}
            <button
              onClick={() => {
                tapHaptic();
                navigate("/settings");
              }}
              className="h-8 w-8 rounded-full border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0 active:scale-95"
              aria-label="Open settings"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* View Switcher: Today / Week View */}
        {onViewModeChange && (
          <div className="flex items-center justify-start mt-3">
            <div className="inline-flex p-0.5 rounded-xl bg-secondary/70 border border-border/60">
              <button
                type="button"
                onClick={() => {
                  tapHaptic();
                  onViewModeChange("today");
                }}
                className={cn(
                  "px-3.5 py-1 text-xs rounded-lg transition-all duration-150 select-none",
                  viewMode === "today"
                    ? "bg-card text-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground font-medium",
                )}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  tapHaptic();
                  onViewModeChange("week");
                }}
                className={cn(
                  "px-3.5 py-1 text-xs rounded-lg transition-all duration-150 select-none",
                  viewMode === "week"
                    ? "bg-card text-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground font-medium",
                )}
              >
                Week View
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Today's Progress Card */}
      {viewMode === "today" && (
        <div className="px-5 pt-1 pb-3">
          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground font-semibold">
                  Today's Progress
                </p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                    {completed}
                  </span>
                  <span className="text-muted-foreground text-sm font-normal tabular-nums">
                    / {total} tasks
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground font-normal">
                  {getProgressStatus()}
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
                  {pct}%
                </span>
              </div>
            </div>

            <div className="mt-3.5 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
