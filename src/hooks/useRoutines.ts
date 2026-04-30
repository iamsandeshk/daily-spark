import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Routine, RoutineState, Section } from "@/lib/routine-types";
import { applyDailyReset, loadState, saveState, todayKey, todayLiveHistory, yesterdayKey } from "@/lib/storage";

const uid = () => Math.random().toString(36).slice(2, 10);

/** Merge today's live snapshot into history so the calendar always reflects current progress. */
const withLiveToday = (s: RoutineState): RoutineState => {
  const today = todayLiveHistory(s);
  return { ...s, history: { ...s.history, [today.date]: today } };
};

export const useRoutines = () => {
  const [state, setStateRaw] = useState<RoutineState>(() => withLiveToday(loadState()));
  const stateRef = useRef(state);
  const timerRef = useRef<number | null>(null);

  const syncFromStorage = useCallback(() => {
    const next = withLiveToday(loadState());
    stateRef.current = next;
    setStateRaw(next);
  }, []);

  const commitState = useCallback((next: RoutineState) => {
    stateRef.current = next;
    saveState(next);
    setStateRaw(next);
    // Notify other useRoutines() instances in this tab to refresh.
    window.dispatchEvent(new Event("routines:updated"));
  }, []);

  // Persist immediately before React navigation can unmount this hook.
  const setState = useCallback((updater: RoutineState | ((p: RoutineState) => RoutineState)) => {
    const prev = stateRef.current;
    const next = typeof updater === "function" ? (updater as (p: RoutineState) => RoutineState)(prev) : updater;
    commitState(next);
    return next;
  }, [commitState]);

  const recheck = useCallback(() => {
    setState((s) => withLiveToday(applyDailyReset(s)));
  }, []);

  useEffect(() => {
    const onFocus = () => recheck();
    const onVisibility = () => document.visibilityState === "visible" && recheck();
    // Cross-tab + cross-instance sync: when any other useRoutines() saves, refresh from storage.
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === "daily-routine-os/v1") {
        syncFromStorage();
      }
    };
    const onLocal = () => syncFromStorage();
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    window.addEventListener("routines:updated", onLocal);
    document.addEventListener("visibilitychange", onVisibility);

    const scheduleMidnight = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 5, 0);
      const ms = next.getTime() - now.getTime();
      timerRef.current = window.setTimeout(() => {
        recheck();
        scheduleMidnight();
      }, ms);
    };
    scheduleMidnight();

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("routines:updated", onLocal);
      document.removeEventListener("visibilitychange", onVisibility);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [recheck, syncFromStorage]);

  const toggleRoutine = useCallback((id: string) => {
    setState((s) => {
      const today = todayKey();
      const yest = yesterdayKey(today);
      const next: RoutineState = {
        ...s,
        routines: s.routines.map((r) => {
          if (r.id !== id) return r;
          const willComplete = !r.isCompleted;
          // Sync all checkbox blocks inside this routine to the new state
          const syncedBlocks = r.blocks
            ? r.blocks.map((b) => (b.type === "checkbox" ? { ...b, checked: willComplete } : b))
            : r.blocks;
          if (willComplete) {
            const continuing = r.lastCompletedDate === yest || r.lastCompletedDate === today;
            return {
              ...r,
              blocks: syncedBlocks,
              isCompleted: true,
              lastCompletedDate: today,
              streakCount: continuing ? (r.lastCompletedDate === today ? r.streakCount : r.streakCount + 1) : 1,
            };
          }
          const rollback = r.lastCompletedDate === today ? Math.max(0, r.streakCount - 1) : r.streakCount;
          return {
            ...r,
            blocks: syncedBlocks,
            isCompleted: false,
            lastCompletedDate: r.lastCompletedDate === today ? yest : r.lastCompletedDate,
            streakCount: rollback,
          };
        }),
      };
      return withLiveToday(next);
    });
  }, []);

  /** Update blocks AND auto-sync isCompleted based on checkbox state.
   *  - All checkboxes checked (and ≥1 exists) → routine complete
   *  - Any checkbox unchecked → routine not complete
   *  - No checkbox blocks → leave isCompleted alone
   */
  const setRoutineBlocks = useCallback((id: string, blocks: RoutineState["routines"][number]["blocks"]) => {
    setState((s) => {
      const today = todayKey();
      const yest = yesterdayKey(today);
      return withLiveToday({
        ...s,
        routines: s.routines.map((r) => {
          if (r.id !== id) return r;
          const checks = (blocks ?? []).filter((b) => b.type === "checkbox" && b.text?.trim());
          let isCompleted = r.isCompleted;
          let lastCompletedDate = r.lastCompletedDate;
          let streakCount = r.streakCount;
          if (checks.length > 0) {
            const allDone = checks.every((b) => !!b.checked);
            if (allDone && !r.isCompleted) {
              const continuing = r.lastCompletedDate === yest || r.lastCompletedDate === today;
              isCompleted = true;
              streakCount = continuing ? (r.lastCompletedDate === today ? r.streakCount : r.streakCount + 1) : 1;
              lastCompletedDate = today;
            } else if (!allDone && r.isCompleted) {
              isCompleted = false;
              streakCount = r.lastCompletedDate === today ? Math.max(0, r.streakCount - 1) : r.streakCount;
              lastCompletedDate = r.lastCompletedDate === today ? yest : r.lastCompletedDate;
            }
          }
          return { ...r, blocks, isCompleted, lastCompletedDate, streakCount };
        }),
      });
    });
  }, []);

  const addRoutine = useCallback((data: Omit<Routine, "id" | "isCompleted" | "streakCount" | "order">) => {
    setState((s) => {
      const sectionRoutines = s.routines.filter((r) => r.sectionId === data.sectionId);
      const order = sectionRoutines.length;
      return withLiveToday({
        ...s,
        routines: [...s.routines, { ...data, id: uid(), isCompleted: false, streakCount: 0, order }],
      });
    });
  }, []);

  const updateRoutine = useCallback((id: string, patch: Partial<Routine>) => {
    setState((s) => withLiveToday({ ...s, routines: s.routines.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  }, []);

  const deleteRoutine = useCallback((id: string) => {
    setState((s) => withLiveToday({ ...s, routines: s.routines.filter((r) => r.id !== id) }));
  }, []);

  const reorderRoutine = useCallback((id: string, direction: "up" | "down") => {
    setState((s) => {
      const r = s.routines.find((x) => x.id === id);
      if (!r) return s;
      const siblings = s.routines.filter((x) => x.sectionId === r.sectionId).sort((a, b) => a.order - b.order);
      const idx = siblings.findIndex((x) => x.id === id);
      const swap = direction === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= siblings.length) return s;
      const a = siblings[idx];
      const b = siblings[swap];
      return {
        ...s,
        routines: s.routines.map((x) => {
          if (x.id === a.id) return { ...x, order: b.order };
          if (x.id === b.id) return { ...x, order: a.order };
          return x;
        }),
      };
    });
  }, []);

  const addSection = useCallback((title: string, emoji?: string): string => {
    const newId = uid();
    setState((s) => ({
      ...s,
      sections: [...s.sections, { id: newId, title, emoji, collapsed: false, order: s.sections.length }],
    }));
    return newId;
  }, []);

  const updateSection = useCallback((id: string, patch: Partial<Section>) => {
    setState((s) => ({ ...s, sections: s.sections.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  }, []);

  const deleteSection = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      sections: s.sections.filter((x) => x.id !== id),
      routines: s.routines.filter((r) => r.sectionId !== id),
    }));
  }, []);

  const toggleSectionCollapsed = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      sections: s.sections.map((x) => (x.id === id ? { ...x, collapsed: !x.collapsed } : x)),
    }));
  }, []);

  const reorderSections = useCallback((orderedIds: string[]) => {
    setState((s) => {
      const indexById = new Map(orderedIds.map((id, i) => [id, i] as const));
      return {
        ...s,
        sections: s.sections.map((x) => ({
          ...x,
          order: indexById.has(x.id) ? (indexById.get(x.id) as number) : x.order,
        })),
      };
    });
  }, []);

  const toggleRoutineCollapsed = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      routines: s.routines.map((x) => (x.id === id ? { ...x, collapsed: !x.collapsed } : x)),
    }));
  }, []);

  const reorderRoutines = useCallback((orderedIds: string[]) => {
    setState((s) => {
      const indexById = new Map(orderedIds.map((id, i) => [id, i] as const));
      return {
        ...s,
        routines: s.routines.map((x) => ({
          ...x,
          order: indexById.has(x.id) ? (indexById.get(x.id) as number) : x.order,
        })),
      };
    });
  }, []);

  const completed = state.routines.reduce((acc, r) => {
    const checks = (r.blocks ?? []).filter((b) => b.type === "checkbox" && b.text?.trim());
    return acc + checks.filter((b) => !!b.checked).length;
  }, 0);

  const total = state.routines.reduce((acc, r) => {
    const checks = (r.blocks ?? []).filter((b) => b.type === "checkbox" && b.text?.trim());
    return acc + checks.length;
  }, 0);

  const globalStreak = useMemo(() => {
    let streak = 0;
    const today = todayKey();
    const todayHistory = todayLiveHistory(state);
    const isTodayComplete = todayHistory.total > 0 && todayHistory.completedRoutineIds.length === todayHistory.total;
    
    // Count consecutive complete days backwards from yesterday
    let checkDate = yesterdayKey(today);
    while (true) {
      const hist = state.history[checkDate];
      if (!hist) break;
      const isComplete = hist.total > 0 && hist.completedRoutineIds.length === hist.total;
      if (!isComplete) break;
      streak++;
      checkDate = yesterdayKey(checkDate);
    }
    
    // If today is complete, it adds to the streak. 
    // If not, the streak is just the past consecutive days.
    return isTodayComplete ? streak + 1 : streak;
  }, [state]);

  return {
    state,
    completed,
    total,
    globalStreak,
    toggleRoutine,
    addRoutine,
    updateRoutine,
    setRoutineBlocks,
    deleteRoutine,
    reorderRoutine,
    addSection,
    updateSection,
    deleteSection,
    toggleSectionCollapsed,
    reorderSections,
    toggleRoutineCollapsed,
    reorderRoutines,
  };
};
