import { motion } from "framer-motion";
import { GripVertical, Settings, Flame, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { applyTheme, getThemeMode, getAmoled } from "@/lib/theme";
import { isPro } from "@/lib/pro";
import { tapHaptic } from "@/lib/haptics";

type Props = {
  completed: number;
  total: number;
  onOpenHistory?: () => void;
  reorderActive?: boolean;
  onToggleReorder?: () => void;
  globalStreak?: number;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const dateLabel = () =>
  new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

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

  return (
    <>
      <div className="sticky top-0 z-30 bg-background safe-top px-5 pb-3 flex flex-col gap-2">
        <div className="flex items-center justify-between w-full">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium">{dateLabel()}</p>
          <div className="flex items-center gap-2">
            {!proActive && (
              <button
                onClick={() => {
                  tapHaptic();
                  navigate("/settings/pro");
                }}
                className="flex items-center h-8 gap-1 rounded-full bg-accent px-3 text-[11px] font-black text-accent-foreground active:scale-95 transition-all duration-200 hover:brightness-110 shrink-0"
                aria-label="Upgrade to Pro"
              >
                <Crown size={12} className="fill-accent-foreground/20" />
                PRO
              </button>
            )}
            <div className="flex items-center h-8 gap-1.5 rounded-full bg-accent/10 px-2.5 text-[11px] font-black text-accent border border-accent/20 shrink-0">
              <Flame size={13} strokeWidth={3} className="fill-accent/20" />
              {globalStreak}
            </div>
            {onToggleReorder && (
              <button
                onClick={onToggleReorder}
                className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth shrink-0"
                aria-label="Toggle section reorder"
                aria-pressed={reorderActive}
              >
                <GripVertical size={16} />
              </button>
            )}
            <button
              onClick={() => navigate("/settings")}
              className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth shrink-0"
              aria-label="Open settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{greeting()}</h1>
      </div>

      <div className="px-5 pb-4">
        <div className="mt-2 rounded-2xl border border-border bg-card p-4 shadow-block">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Today's progress</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {completed}
                <span className="text-muted-foreground text-base font-medium"> / {total}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold tabular-nums tracking-tight">{pct}%</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
