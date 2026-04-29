import { motion } from "framer-motion";
import { GripVertical, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  completed: number;
  total: number;
  onOpenHistory?: () => void;
  reorderActive?: boolean;
  onToggleReorder?: () => void;
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

const useTheme = () => {
  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined" ? document.documentElement.classList.contains("dark") : false,
  );
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = saved ? saved === "dark" : prefers;
    document.documentElement.classList.toggle("dark", dark);
    setIsDark(dark);
  }, []);
  const toggle = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  };
  return { isDark, toggle };
};

export const ProgressHeader = ({ completed, total, onOpenHistory, reorderActive, onToggleReorder }: Props) => {
  const { isDark, toggle } = useTheme();
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <header className="safe-top px-5 pb-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium">{dateLabel()}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{greeting()}</h1>
        </div>
        <div className="flex items-center gap-2">
          {onToggleReorder && (
            <button
              onClick={onToggleReorder}
              className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
              aria-label="Toggle section reorder"
              aria-pressed={reorderActive}
            >
              <GripVertical size={16} />
            </button>
          )}
          <button
            onClick={toggle}
            className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-block">
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
            {pct === 100 && total > 0 && (
              <p className="text-xs text-success font-medium mt-0.5">Day complete ✨</p>
            )}
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-foreground rounded-full"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>
    </header>
  );
};
