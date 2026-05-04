import { motion } from "framer-motion";
import { GripVertical, Settings, Flame, Sun, Moon, Monitor, Info, Twitter, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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

type ThemeMode = "light" | "dark" | "system";

const applyTheme = (mode: ThemeMode) => {
  const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = mode === "dark" || (mode === "system" && prefers);
  document.documentElement.classList.toggle("dark", dark);
  StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
};

const useTheme = () => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
    return "system";
  });

  useEffect(() => {
    applyTheme(mode);
    if (mode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [mode]);

  const setTheme = (m: ThemeMode) => {
    localStorage.setItem("theme", m);
    setMode(m);
  };

  return { mode, setTheme };
};

export const ProgressHeader = ({ completed, total, onOpenHistory, reorderActive, onToggleReorder, globalStreak = 0 }: Props) => {
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
          <div className="flex items-center h-8 gap-1.5 rounded-full bg-accent/10 px-2.5 text-[11px] font-black text-accent border border-accent/20">
            <Flame size={13} strokeWidth={3} className="fill-accent/20" />
            {globalStreak}
          </div>
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
