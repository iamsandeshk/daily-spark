import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, MoreHorizontal, Check, Undo2, Flag, Pencil, Archive, Trash2, Settings2, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useRoutines } from "@/hooks/useRoutines";
import { getRoutineColor } from "@/lib/routine-colors";
import { RoutineIcon } from "@/components/routine/RoutineIcon";
import { completionHaptic, tapHaptic } from "@/lib/haptics";
import { todayKey } from "@/lib/storage";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const HabitDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const r = useRoutines();
  const routine = r.state.routines.find((x) => x.id === id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const today = todayKey();

  const doneDates = useMemo(() => {
    const set = new Set<string>();
    Object.values(r.state.history ?? {}).forEach((h) => {
      if (id && h.completedRoutineIds?.includes(id)) set.add(h.date);
    });
    if (routine?.isCompleted) set.add(today);
    else set.delete(today);
    return set;
  }, [r.state.history, id, routine?.isCompleted, today]);

  const bestStreak = useMemo(() => {
    const sorted = [...doneDates].sort();
    let best = 0, cur = 0, prev: Date | null = null;
    for (const k of sorted) {
      const d = new Date(k + "T00:00:00");
      cur = prev && (d.getTime() - prev.getTime()) / 86400000 === 1 ? cur + 1 : 1;
      best = Math.max(best, cur);
      prev = d;
    }
    return Math.max(best, routine?.streakCount ?? 0);
  }, [doneDates, routine?.streakCount]);

  if (!routine) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <button onClick={() => navigate("/")} className="text-muted-foreground">Back home</button>
      </div>
    );
  }

  const color = getRoutineColor(routine);
  const isDone = routine.isCompleted;

  // Calendar (Monday-first)
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const toggle = () => {
    if (!isDone) completionHaptic(); else tapHaptic();
    r.toggleRoutine(routine.id);
  };

  const menuItems = [
    { label: "Edit", icon: Pencil, onClick: () => navigate(`/routine/${routine.id}`) },
    { label: "Schedule & reset", icon: Settings2, onClick: () => navigate(`/routine/${routine.id}/settings`) },
    { label: "Archive", icon: Archive, onClick: () => { r.updateRoutine(routine.id, { archived: true }); navigate("/"); } },
    { label: "Delete habit", icon: Trash2, danger: true, onClick: () => { if (confirm(`Delete “${routine.title}”?`)) { r.deleteRoutine(routine.id); navigate("/"); } } },
  ];

  return (
    <div
      className="min-h-screen bg-background text-foreground pb-44 relative"
      style={{ background: `radial-gradient(120% 45% at 50% 0%, ${color.glow} 0%, transparent 70%), hsl(var(--background))` }}
    >
      <header className="safe-top flex items-center justify-between px-4 pt-3">
        <button onClick={() => navigate(-1)} aria-label="Close" className="h-11 w-11 rounded-full bg-foreground/10 backdrop-blur flex items-center justify-center">
          <X size={20} />
        </button>
        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} aria-label="More" className="h-11 px-4 rounded-full bg-foreground/10 backdrop-blur flex items-center justify-center">
            <MoreHorizontal size={20} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-12 z-50 w-60 rounded-3xl border border-border bg-card/95 backdrop-blur-xl p-2 shadow-2xl">
                {menuItems.map((m) => (
                  <button
                    key={m.label}
                    onClick={() => { setMenuOpen(false); m.onClick(); }}
                    className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-[15px] hover:bg-foreground/5", m.danger && "text-destructive")}
                  >
                    <m.icon size={18} /> {m.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      <section className="text-center px-6 pt-6">
        <p className="text-sm font-semibold text-muted-foreground">🔥 <span className="text-foreground">{routine.streakCount}-day</span> streak</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <RoutineIcon routine={routine} size={30} />
          <h1 className="text-3xl font-bold tracking-tight truncate">{routine.title}</h1>
        </div>
        <p className="mt-2 text-muted-foreground">{routine.description || "Every day"}</p>
      </section>

      <section className="mx-6 mt-8 py-6 border-y border-border/60 grid grid-cols-2 divide-x divide-border/60 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Best Streak</p>
          <p className="text-3xl font-bold mt-1">{bestStreak}</p>
          <p className="text-sm">days</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-3xl font-bold mt-1">{doneDates.size}</p>
          <p className="text-sm">days</p>
        </div>
      </section>

      <section className="px-5 mt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays size={22} className="text-muted-foreground" />
            <h2 className="text-2xl font-bold">{cursor.toLocaleString(undefined, { month: "long", year: year !== new Date().getFullYear() ? "numeric" : undefined })}</h2>
          </div>
          <div className="flex gap-1">
            <button aria-label="Previous month" onClick={() => setCursor(new Date(year, month - 1, 1))} className="h-9 w-9 rounded-full bg-foreground/5 flex items-center justify-center"><ChevronLeft size={18} /></button>
            <button aria-label="Next month" onClick={() => setCursor(new Date(year, month + 1, 1))} className="h-9 w-9 rounded-full bg-foreground/5 flex items-center justify-center"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 rounded-full bg-foreground/5 py-2 text-center text-sm text-muted-foreground">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div className="mt-4 grid grid-cols-7 gap-y-3 justify-items-center">
          {cells.map((day, i) => {
            if (!day) return <span key={i} className="h-10 w-10 flex items-center justify-center text-muted-foreground/40">—</span>;
            const k = keyOf(new Date(year, month, day));
            const done = doneDates.has(k);
            const isToday = k === today;
            return (
              <span
                key={i}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium",
                  done ? "text-background" : "bg-foreground/5 text-muted-foreground",
                  isToday && !done && "border-2 border-dashed border-foreground text-foreground bg-transparent",
                )}
                style={done ? { backgroundColor: color.hex } : undefined}
              >
                {day}
              </span>
            );
          })}
        </div>
      </section>

      <footer className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent pt-8" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
        <p className="text-center text-lg font-semibold mb-3">Today</p>
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button onClick={() => !isDone && toggle()} className="flex flex-col items-center gap-1 text-muted-foreground w-20">
            <Flag size={24} /><span className="text-xs">Complete</span>
          </button>
          <button
            onClick={toggle}
            aria-label={isDone ? "Mark incomplete" : "Mark complete"}
            className={cn("h-16 w-16 rounded-full flex items-center justify-center transition-all active:scale-90",
              isDone ? "text-background" : "border-[3px] border-dashed border-muted-foreground/60")}
            style={isDone ? { backgroundColor: color.hex } : undefined}
          >
            <Check size={30} strokeWidth={3} />
          </button>
          <button onClick={() => isDone && toggle()} className={cn("flex flex-col items-center gap-1 w-20", isDone ? "text-foreground" : "text-muted-foreground/50")}>
            <Undo2 size={24} /><span className="text-xs">Undo</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default HabitDetail;
