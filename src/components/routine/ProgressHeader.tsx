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
  const { mode, setTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System default", icon: Monitor },
  ];

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
            onClick={() => setSettingsOpen(true)}
            className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
            aria-label="Open settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="rounded-[28px] p-7 gap-6 max-w-[90vw] sm:max-w-md">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-2xl font-serif font-bold text-left">Settings</DialogTitle>
            <DialogDescription className="text-muted-foreground text-[14px] text-left">
              Personalize your experience.
            </DialogDescription>
          </DialogHeader>

          <section className="space-y-2.5">
            <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1">Appearance</h3>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {themeOptions.map((opt, i) => {
                const Icon = opt.icon;
                const active = mode === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/60",
                      i !== themeOptions.length - 1 && "border-b border-border",
                    )}
                  >
                    <Icon size={18} className="text-muted-foreground shrink-0" />
                    <span className="flex-1 text-[15px] font-medium">{opt.label}</span>
                    {active && <Check size={18} className="text-foreground shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2.5">
            <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1">About</h3>
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Info size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[15px] font-semibold">Daily Routines</p>
                  <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">
                    A simple, calm space to track the rhythms that matter to you — routines, moods, and progress in one place.
                  </p>
                </div>
              </div>
              <a
                href="https://x.com/The1UX"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl bg-muted/60 hover:bg-muted px-3.5 py-3 transition-colors"
              >
                <Twitter size={18} className="text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-[13px] text-muted-foreground">Developer</p>
                  <p className="text-[14px] font-semibold">@The1UX</p>
                </div>
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">Follow</span>
              </a>
            </div>
          </section>
        </DialogContent>
      </Dialog>

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
