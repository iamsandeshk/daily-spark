import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sun,
  Moon,
  Monitor,
  Info,
  Twitter,
  Check,
  Clock,
  CalendarDays,
  Flame,
  LayoutTemplate,
  Download,
  AlertTriangle,
  Trash2,
  RefreshCcw,
  BarChart3,
} from "lucide-react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useRoutines } from "@/hooks/useRoutines";
import { TEMPLATES } from "@/components/routine/TemplateLibrary";
import { ClockPickerDialog } from "@/components/ClockPickerDialog";
import { cn, uid } from "@/lib/utils";
import { tapHaptic, successHaptic } from "@/lib/haptics";
import { Button } from "@/components/ui/button";
import { Eye, Plus, Sparkles, CheckSquare, Quote, Link2, ListTree } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RoutineBlockContent } from "@/lib/routine-types";

type ThemeMode = "light" | "dark" | "system";

const applyTheme = (mode: ThemeMode) => {
  const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = mode === "dark" || (mode === "system" && prefers);
  document.documentElement.classList.toggle("dark", dark);
  StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => { });
};

const useTheme = () => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme");
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  });
  useEffect(() => {
    applyTheme(mode);
  }, [mode]);
  return {
    mode,
    setTheme: (m: ThemeMode) => {
      localStorage.setItem("theme", m);
      setMode(m);
      tapHaptic();
    },
  };
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1 mt-7 mb-2.5">
    {children}
  </h3>
);

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("rounded-2xl border border-border bg-card overflow-hidden", className)}>{children}</div>
);

const Row = ({
  icon: Icon,
  label,
  hint,
  right,
  onClick,
  destructive,
  last,
}: {
  icon: any;
  label: string;
  hint?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  last?: boolean;
}) => {
  const Wrapper: any = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
        onClick && "hover:bg-muted/60 cursor-pointer",
        !last && "border-b border-border",
        destructive && "text-destructive"
      )}
    >
      <Icon size={18} className={cn("shrink-0", destructive ? "text-destructive" : "text-muted-foreground")} />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium truncate">{label}</div>
        {hint && <div className="text-[12px] text-muted-foreground truncate">{hint}</div>}
      </div>
      {right}
    </Wrapper>
  );
};

const Settings = () => {
  const navigate = useNavigate();
  const r = useRoutines();
  const { mode, setTheme } = useTheme();

  const settings = r.state.settings ?? {};
  const resetHour = settings.resetHour ?? 0;
  const resetMinute = (settings as any).resetMinute ?? 0;
  const startOfWeek = settings.startOfWeek ?? 1;
  const streakGoal = settings.streakGoal ?? 7;

  const updateSettings = (patch: Partial<NonNullable<typeof r.state.settings>>) => {
    const next = { ...r.state, settings: { ...settings, ...patch } };
    localStorage.setItem("daily-routine-os/v1", JSON.stringify(next));
    window.dispatchEvent(new Event("routines:updated"));
  };

  const [resetOpen, setResetOpen] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [previewTpl, setPreviewTpl] = useState<typeof TEMPLATES[number] | null>(null);
  const [resetStreaksOpen, setResetStreaksOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [clockOpen, setClockOpen] = useState(false);
  const [customStreakEditing, setCustomStreakEditing] = useState(false);
  const [customStreakRaw, setCustomStreakRaw] = useState("");

  const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const formatTime = (h: number, m: number = 0) => {
    const am = h < 12;
    const hh = h % 12 === 0 ? 12 : h % 12;
    const mm = m.toString().padStart(2, "0");
    return `${hh}:${mm} ${am ? "AM" : "PM"}`;
  };

  // Keep legacy formatHour for any other callers
  const formatHour = (h: number) => formatTime(h, 0);

  const RESET_PRESETS = [
    { label: "Midnight", sub: "12:00 AM", hour: 0, minute: 0 },
    { label: "Early Bird", sub: "5:00 AM", hour: 5, minute: 0 },
    { label: "Morning", sub: "6:00 AM", hour: 6, minute: 0 },
    { label: "Late Morning", sub: "9:00 AM", hour: 9, minute: 0 },
  ];

  const isCustomSelected = !RESET_PRESETS.some(
    (p) => p.hour === resetHour && p.minute === resetMinute
  );

  const handleClockConfirm = (h: number, m: number) => {
    updateSettings({ resetHour: h, resetMinute: m } as any);
    tapHaptic();
  };

  const handleAddTemplate = (t: typeof TEMPLATES[number]) => {
    const sectionId = r.state.sections[0]?.id || r.addSection("Routines");
    const blocks: RoutineBlockContent[] = t.blocks.map((b) => ({ ...b, id: uid() }));
    r.addRoutine({ title: t.title, emoji: t.emoji, description: t.description, sectionId, blocks });
    successHaptic();
    setTplOpen(false);
  };

  const handleExport = () => {
    const data = localStorage.getItem("daily-routine-os/v1") ?? "{}";
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-routines-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    successHaptic();
  };

  const handleResetStreaks = () => {
    const next = {
      ...r.state,
      routines: r.state.routines.map((x) => ({ ...x, streakCount: 0, lastCompletedDate: undefined })),
    };
    localStorage.setItem("daily-routine-os/v1", JSON.stringify(next));
    window.dispatchEvent(new Event("routines:updated"));
    successHaptic();
    setResetStreaksOpen(false);
  };

  const handleDeleteAll = () => {
    localStorage.removeItem("daily-routine-os/v1");
    localStorage.removeItem("template-library-collapsed");
    successHaptic();
    setDeleteAllOpen(false);
    window.location.href = "/";
  };

  return (
    <div className="min-h-full bg-background pb-20">
      <header className="safe-top px-5 pb-3 pt-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-serif font-bold">Settings</h1>
      </header>

      <main className="px-5">
        <SectionLabel>Appearance</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const active = mode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border transition-all",
                  active
                    ? "border-foreground bg-foreground/5"
                    : "border-border bg-card hover:bg-muted/60"
                )}
              >
                <Icon size={18} />
                <span className="text-[12px] font-semibold">{opt.label}</span>
              </button>
            );
          })}
        </div>

        <SectionLabel>Routines</SectionLabel>
        <Card>
          <Row
            icon={Clock}
            label="Daily reset time"
            hint={`Routines reset at ${formatTime(resetHour, resetMinute)}`}
            right={<span className="text-[13px] text-muted-foreground">{formatTime(resetHour, resetMinute)}</span>}
            onClick={() => setResetOpen(true)}
          />
          <Row
            icon={CalendarDays}
            label="Start of week"
            right={
              <div className="flex rounded-full bg-muted p-0.5 text-[12px] font-bold">
                {[
                  { v: 1, l: "Mon" },
                  { v: 0, l: "Sun" },
                ].map((opt) => (
                  <button
                    key={opt.v}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSettings({ startOfWeek: opt.v as 0 | 1 });
                      tapHaptic();
                    }}
                    className={cn(
                      "px-3 py-1 rounded-full transition-colors",
                      startOfWeek === opt.v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    )}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            }
          />
          <Row
            icon={Flame}
            label="Streak goal"
            hint={`Target ${streakGoal} day streak`}
            right={<span className="text-[13px] text-muted-foreground tabular-nums">{streakGoal}d</span>}
            onClick={() => setStreakOpen(true)}
            last
          />
        </Card>

        <SectionLabel>Library</SectionLabel>
        <Card>
          <Row
            icon={LayoutTemplate}
            label="Templates"
            hint="Browse and add ready-made routines"
            onClick={() => setTplOpen(true)}
            last
          />
        </Card>

        <SectionLabel>Insights</SectionLabel>
        <Card>
          <Row
            icon={BarChart3}
            label="Weekly report"
            hint="See completed tasks, mood, and skip patterns"
            onClick={() => navigate("/weekly-report")}
            last
          />
        </Card>

        <SectionLabel>Data</SectionLabel>
        <Card>
          <Row
            icon={Download}
            label="Export data"
            hint="Download a JSON backup"
            onClick={handleExport}
            last
          />
        </Card>

        <SectionLabel>
          <span className="inline-flex items-center gap-1.5 text-destructive">
            <AlertTriangle size={11} /> Danger zone
          </span>
        </SectionLabel>
        <Card className="border-destructive/30">
          <Row
            icon={RefreshCcw}
            label="Reset all streaks"
            hint="Set every routine streak to 0"
            onClick={() => setResetStreaksOpen(true)}
            destructive
          />
          <Row
            icon={Trash2}
            label="Delete all data"
            hint="Wipe routines, history, moods, settings"
            onClick={() => setDeleteAllOpen(true)}
            destructive
            last
          />
        </Card>

        <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1 mt-7 mb-2.5">
          About
        </h3>
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
      </main>

      {/* Reset hour picker */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="rounded-[28px] p-6 max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-left">Daily reset time</DialogTitle>
            <DialogDescription className="text-left text-[14px]">
              Choose when each new day begins.
            </DialogDescription>
          </DialogHeader>

          {/* Preset tiles */}
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            {RESET_PRESETS.map((p) => {
              const active = resetHour === p.hour && resetMinute === p.minute && !isCustomSelected;
              return (
                <button
                  key={p.label}
                  onClick={() => {
                    updateSettings({ resetHour: p.hour, resetMinute: p.minute } as any);
                    tapHaptic();
                    setResetOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all",
                    active
                      ? "border-foreground bg-foreground/5 shadow-sm"
                      : "border-border bg-card hover:bg-muted/50"
                  )}
                >
                  <div>
                    <p className="text-[13px] font-bold leading-tight">{p.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{p.sub}</p>
                  </div>
                  {active && <Check size={14} className="ml-auto shrink-0" />}
                </button>
              );
            })}

            {/* Custom tile — opens analog clock */}
            <button
              onClick={() => {
                setResetOpen(false);
                setTimeout(() => setClockOpen(true), 150);
              }}
              className={cn(
                "col-span-2 flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all",
                isCustomSelected
                  ? "border-foreground bg-foreground/5 shadow-sm"
                  : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <div className="flex-1">
                <p className="text-[13px] font-bold leading-tight">Custom time</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isCustomSelected ? formatTime(resetHour, resetMinute) : "Set your own time"}
                </p>
              </div>
              {isCustomSelected && <Check size={14} className="shrink-0" />}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analog clock picker */}
      <ClockPickerDialog
        open={clockOpen}
        onOpenChange={setClockOpen}
        initialHour={resetHour}
        initialMinute={resetMinute}
        onConfirm={handleClockConfirm}
      />

      {/* Streak goal */}
      <Dialog open={streakOpen} onOpenChange={(o) => { setStreakOpen(o); if (!o) setCustomStreakEditing(false); }}>
        <DialogContent className="rounded-[28px] p-6 max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-left">Streak goal</DialogTitle>
            <DialogDescription className="text-left text-[14px]">
              Pick the streak you're aiming for.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[3, 7, 14, 21, 30, 60, 90, 365].map((d) => (
              <button
                key={d}
                onClick={() => {
                  updateSettings({ streakGoal: d });
                  tapHaptic();
                  setCustomStreakEditing(false);
                  setStreakOpen(false);
                }}
                className={cn(
                  "py-3 rounded-xl border text-[14px] font-bold transition-colors",
                  streakGoal === d && !customStreakEditing ? "border-foreground bg-foreground/5" : "border-border hover:bg-muted/60"
                )}
              >
                {d} days
              </button>
            ))}

            {/* Custom streak tile */}
            {customStreakEditing ? (
              <div className={cn(
                "relative py-2 px-2 rounded-xl border flex items-center",
                "border-foreground bg-foreground/5"
              )}>
                <input
                  autoFocus
                  value={customStreakRaw}
                  onChange={(e) => setCustomStreakRaw(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const n = parseInt(customStreakRaw, 10);
                      if (!isNaN(n) && n > 0) {
                        updateSettings({ streakGoal: n });
                        tapHaptic();
                        setCustomStreakEditing(false);
                        setStreakOpen(false);
                      }
                    }
                    if (e.key === "Escape") setCustomStreakEditing(false);
                  }}
                  onBlur={() => {
                    const n = parseInt(customStreakRaw, 10);
                    if (!isNaN(n) && n > 0) {
                      updateSettings({ streakGoal: n });
                      tapHaptic();
                    }
                    setCustomStreakEditing(false);
                  }}
                  placeholder="days"
                  inputMode="numeric"
                  className="w-full bg-transparent text-center text-[14px] font-bold outline-none placeholder:text-muted-foreground"
                />
              </div>
            ) : (
              <button
                onClick={() => {
                  setCustomStreakRaw("");
                  setCustomStreakEditing(true);
                }}
                className={cn(
                  "py-3 rounded-xl border text-[14px] font-bold transition-colors",
                  ![3, 7, 14, 21, 30, 60, 90, 365].includes(streakGoal)
                    ? "border-foreground bg-foreground/5"
                    : "border-border hover:bg-muted/60"
                )}
              >
                {![3, 7, 14, 21, 30, 60, 90, 365].includes(streakGoal) ? `${streakGoal}d` : "Custom"}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Templates */}
      <Dialog open={tplOpen} onOpenChange={setTplOpen}>
        <DialogContent className="rounded-[28px] p-6 max-w-[90vw] sm:max-w-md max-h-[80vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-left">Templates</DialogTitle>
            <DialogDescription className="text-left text-[14px]">
              Tap to add a ready-made routine to your day.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.title}
                onClick={() => {
                  tapHaptic();
                  setPreviewTpl(t);
                }}
                className={cn(
                  "w-full flex items-center gap-3.5 p-3 rounded-2xl border border-border bg-card text-left transition-all",
                  "hover:border-accent/40 hover:shadow-block active:scale-[0.98] group",
                )}
              >
                <div className="h-11 w-11 shrink-0 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {t.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[15px] text-foreground leading-tight">{t.title}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{t.description}</p>
                </div>
                <div className="h-8 w-8 shrink-0 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all">
                  <Eye size={15} strokeWidth={2.5} />
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Preview */}
      <Dialog open={!!previewTpl} onOpenChange={(o) => !o && setPreviewTpl(null)}>
        <DialogContent className="rounded-[28px] p-0 gap-0 max-w-[92vw] sm:max-w-md overflow-hidden">
          {previewTpl && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 space-y-2 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-center text-2xl">
                    {previewTpl.emoji}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <DialogTitle className="text-xl font-serif font-bold leading-tight">
                      {previewTpl.title}
                    </DialogTitle>
                    <DialogDescription className="text-[12px] text-muted-foreground mt-0.5">
                      {previewTpl.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="max-h-[55vh] overflow-y-auto px-6 py-4 space-y-1.5">
                {previewTpl.blocks.map((b, i) => (
                  <PreviewBlockRow key={i} block={b} />
                ))}
              </div>

              <DialogFooter className="flex flex-row gap-3 sm:justify-end px-6 py-4 border-t border-border bg-muted/20">
                <Button
                  variant="outline"
                  onClick={() => setPreviewTpl(null)}
                  className="flex-1 rounded-2xl h-11 font-semibold border-border/60"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const tpl = previewTpl;
                    setPreviewTpl(null);
                    handleAddTemplate(tpl);
                  }}
                  className="flex-1 rounded-2xl h-11 font-bold bg-foreground text-background hover:bg-foreground/90"
                >
                  <Plus size={15} strokeWidth={3} className="mr-1" />
                  Add template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset streaks confirm */}
      <Dialog open={resetStreaksOpen} onOpenChange={setResetStreaksOpen}>
        <DialogContent className="rounded-[28px] p-7 max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-left">Reset all streaks?</DialogTitle>
            <DialogDescription className="text-left text-[14px]">
              This will set every routine streak back to 0. Your tasks and history won't be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-3">
            <Button variant="outline" onClick={() => setResetStreaksOpen(false)} className="flex-1 rounded-2xl h-12 font-bold">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetStreaks} className="flex-1 rounded-2xl h-12 font-bold">
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete all confirm */}
      <Dialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <DialogContent className="rounded-[28px] p-7 max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-left">Delete all data?</DialogTitle>
            <DialogDescription className="text-left text-[14px]">
              This permanently removes every routine, mood entry, history record, and setting. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-3">
            <Button variant="outline" onClick={() => setDeleteAllOpen(false)} className="flex-1 rounded-2xl h-12 font-bold">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll} className="flex-1 rounded-2xl h-12 font-bold">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
