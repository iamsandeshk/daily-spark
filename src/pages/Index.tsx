import { AnimatePresence, motion, Reorder, useDragControls } from "framer-motion";
import { GripVertical, Sparkles, Plus } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRoutines } from "@/hooks/useRoutines";
import { HomeHeader } from "@/components/routine/HomeHeader";
import { HomeRoutineCard } from "@/components/routine/HomeRoutineCard";
import { HomeWeekView } from "@/components/routine/HomeWeekView";
import { SuggestionCard } from "@/components/routine/SuggestionCard";
import { ProCard } from "@/components/routine/ProCard";
import { FloatingBottomNav } from "@/components/routine/FloatingBottomNav";
import { HomeMenuSheet } from "@/components/routine/HomeMenuSheet";
import { CarryForwardDialog } from "@/components/routine/CarryForwardDialog";
import { CompletionCelebration } from "@/components/routine/CompletionCelebration";
import { StreakGoalCelebration } from "@/components/routine/StreakGoalCelebration";
import type { Routine } from "@/lib/routine-types";
import { tapHaptic } from "@/lib/haptics";
import { isPro, FREE_ROUTINE_LIMIT } from "@/lib/pro";
import { toast } from "@/hooks/use-toast";
import { applyTheme, getThemeMode, getAmoled } from "@/lib/theme";

// Helper hook to bootstrap theme settings on Home mount
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

const Index = () => {
  useThemeBootstrap();
  const r = useRoutines();
  const navigate = useNavigate();
  const [reorderMode, setReorderMode] = useState(false);
  const [viewMode, setViewMode] = useState<"today" | "week">("today");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevCompleted, setPrevCompleted] = useState(r.completed);
  const streakGoal = r.state.settings?.streakGoal ?? 7;
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);

  // Helper to get the day after a YYYY-MM-DD date string
  const getDayAfter = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  };

  // 1. One-time check on mount to show celebration if streak goal was reached
  useEffect(() => {
    const completedDate = localStorage.getItem("streak-goal-completed-date");
    if (completedDate) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const dayAfterCompleted = getDayAfter(completedDate);

      if (todayStr === completedDate || todayStr === dayAfterCompleted) {
        const celebrationShown = localStorage.getItem("streak-goal-celebration-shown");
        if (celebrationShown !== completedDate) {
          setShowStreakCelebration(true);
          localStorage.setItem("streak-goal-celebration-shown", completedDate);
        }
      }
    }
  }, []);

  // 2. Reactive check to detect completion during the current session
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const isTodayComplete = r.total > 0 && r.completed === r.total;
    const completedDate = localStorage.getItem("streak-goal-completed-date");

    if (isTodayComplete && r.globalStreak >= streakGoal && completedDate !== todayStr) {
      localStorage.setItem("streak-goal-completed-date", todayStr);
      localStorage.setItem("streak-goal-celebration-shown", todayStr);
      setShowStreakCelebration(true);

      import("@/lib/notifications").then(({ scheduleStreakGoalNotification }) => {
        scheduleStreakGoalNotification(streakGoal).catch((err) => {
          console.error("Failed to schedule streak goal notification:", err);
        });
      });
    }
  }, [r.completed, r.total, r.globalStreak, streakGoal]);

  useEffect(() => {
    if (
      r.total > 0 &&
      r.completed === r.total &&
      prevCompleted < r.total &&
      r.state.settings?.completionCelebration !== false
    ) {
      setShowCelebration(true);
      tapHaptic();
    }
    setPrevCompleted(r.completed);
  }, [r.completed, r.total]);

  const today = new Date().toISOString().slice(0, 10);
  const isVisible = (rt: Routine) => {
    if (rt.archived) return false;
    if (rt.startDate && today < rt.startDate) return false;
    if (rt.endDate && today > rt.endDate) return false;
    return true;
  };

  const sortedRoutines = useMemo(() => {
    return [...r.state.routines].filter(isVisible).sort((a, b) => a.order - b.order);
  }, [r.state.routines]);

  const [order, setOrder] = useState<Routine[]>(sortedRoutines);

  useEffect(() => {
    setOrder(sortedRoutines);
  }, [sortedRoutines]);

  // Count remaining uncompleted routines for the header indicator
  const uncompletedCount = useMemo(() => {
    return order.filter((rt) => !rt.isCompleted).length;
  }, [order]);

  const newRoutine = (routineId?: string) => {
    if (routineId) {
      navigate(`/routine/${routineId}`);
      return;
    }
    const activeCount = r.state.routines.filter((rt) => !rt.archived).length;
    if (!isPro() && activeCount >= FREE_ROUTINE_LIMIT) {
      toast({
        title: "Free tier limit reached",
        description: `Free includes up to ${FREE_ROUTINE_LIMIT} routines. Upgrade to Pro for unlimited.`,
      });
      navigate("/settings/pro");
      return;
    }
    navigate("/routine/new");
  };

  const handleReorder = (next: Routine[]) => {
    setOrder(next);
    r.reorderRoutines(next.map((s) => s.id));
  };

  return (
    <div className="min-h-screen bg-black text-foreground relative no-select overflow-x-hidden pb-40">
      {/* Completion Celebrations */}
      <CompletionCelebration
        show={showCelebration}
        onDone={() => setShowCelebration(false)}
      />
      <StreakGoalCelebration
        show={showStreakCelebration}
        streakGoal={streakGoal}
        onClose={() => setShowStreakCelebration(false)}
      />

      {/* Carry-forward dialog when applicable */}
      <CarryForwardDialog
        state={r.state}
        onAccept={r.acceptCarryForward}
        onDismiss={r.dismissCarryForward}
      />

      {/* Reference-accurate Top Bar Header */}
      <HomeHeader
        viewMode={viewMode}
        uncompletedCount={uncompletedCount}
        onAddRoutine={() => newRoutine()}
      />

      {/* Main Content Area */}
      <main className="px-4 pt-1 relative z-10 max-w-xl mx-auto">
        {viewMode === "week" ? (
          <HomeWeekView routines={order} state={r.state} />
        ) : (
          <div className="space-y-3.5">
            {order.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-[#141416] p-8 text-center my-6">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/70 mb-3.5">
                  <Sparkles size={22} />
                </div>
                <h3 className="text-[17px] font-semibold text-white tracking-tight">
                  No active routines
                </h3>
                <p className="text-[13px] text-white/50 mt-1 max-w-xs mx-auto">
                  Create your first routine to start tracking your daily habits.
                </p>
                <div className="mt-5 flex justify-center">
                  <button
                    onClick={() => newRoutine()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white text-black px-5 py-2.5 text-xs font-bold hover:bg-white/90 active:scale-95 transition-all shadow-md"
                  >
                    <Plus size={15} strokeWidth={2.5} />
                    Create Routine
                  </button>
                </div>
              </div>
            ) : reorderMode ? (
              <Reorder.Group axis="y" values={order} onReorder={handleReorder} className="space-y-3.5">
                {order.map((routine) => (
                  <ReorderItem
                    key={routine.id}
                    routine={routine}
                    onOpen={() => navigate(`/routine/${routine.id}`)}
                    onToggleComplete={() => r.toggleRoutine(routine.id)}
                  />
                ))}
              </Reorder.Group>
            ) : (
              <div className="space-y-3.5">
                {order.map((routine) => (
                  <HomeRoutineCard
                    key={routine.id}
                    routine={routine}
                    onOpen={() => navigate(`/routine/${routine.id}`)}
                    onToggleComplete={() => r.toggleRoutine(routine.id)}
                  />
                ))}
              </div>
            )}

            {/* Supportive Suggestion Card (Reference 2 & 3) */}
            <div className="pt-1">
              <SuggestionCard onAddRoutine={() => newRoutine()} />
            </div>

            {/* Pro Promotion Card (Reference 2) */}
            <div className="pt-0.5">
              <ProCard />
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation (Reference 1, 2, 3) */}
      <FloatingBottomNav
        viewMode={viewMode}
        onViewModeToggle={() => setViewMode((m) => (m === "today" ? "week" : "today"))}
        onOpenMenu={() => setMenuOpen(true)}
      />

      {/* Options and Menu Sheet */}
      <HomeMenuSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onToggleReorder={() => setReorderMode((v) => !v)}
        reorderActive={reorderMode}
      />
    </div>
  );
};

type ReorderItemProps = {
  routine: Routine;
  onOpen: () => void;
  onToggleComplete: () => void;
};

const ReorderItem = ({ routine, onOpen, onToggleComplete }: ReorderItemProps) => {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={routine}
      dragListener={false}
      dragControls={controls}
      className="relative flex items-center"
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        className="shrink-0 p-2 text-white/40 hover:text-white touch-none cursor-grab active:cursor-grabbing mr-1"
        aria-label={`Drag ${routine.title}`}
      >
        <GripVertical size={18} />
      </button>
      <div className="flex-1 min-w-0">
        <HomeRoutineCard
          routine={routine}
          onOpen={onOpen}
          onToggleComplete={onToggleComplete}
        />
      </div>
    </Reorder.Item>
  );
};

export default Index;
