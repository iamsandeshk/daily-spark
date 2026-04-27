import { useCallback, useEffect, useRef, useState } from "react";
import type { Routine, RoutineState, Section } from "@/lib/routine-types";
import { applyDailyReset, loadState, saveState, todayKey, yesterdayKey } from "@/lib/storage";

const uid = () => Math.random().toString(36).slice(2, 10);

export const useRoutines = () => {
  const [state, setState] = useState<RoutineState>(() => loadState());
  const timerRef = useRef<number | null>(null);

  // Persist on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Re-check reset: on focus, on visibility change, and via a scheduled timer to next midnight
  const recheck = useCallback(() => {
    setState((s) => applyDailyReset(s));
  }, []);

  useEffect(() => {
    const onFocus = () => recheck();
    const onVisibility = () => document.visibilityState === "visible" && recheck();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const scheduleMidnight = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 5, 0); // 00:00:05 next day local
      const ms = next.getTime() - now.getTime();
      timerRef.current = window.setTimeout(() => {
        recheck();
        scheduleMidnight();
      }, ms);
    };
    scheduleMidnight();

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [recheck]);

  const toggleRoutine = useCallback((id: string) => {
    setState((s) => {
      const today = todayKey();
      const yest = yesterdayKey(today);
      return {
        ...s,
        routines: s.routines.map((r) => {
          if (r.id !== id) return r;
          const willComplete = !r.isCompleted;
          if (willComplete) {
            const continuing = r.lastCompletedDate === yest || r.lastCompletedDate === today;
            return {
              ...r,
              isCompleted: true,
              lastCompletedDate: today,
              streakCount: continuing ? (r.lastCompletedDate === today ? r.streakCount : r.streakCount + 1) : 1,
            };
          }
          // Un-checking on the same day rolls back the streak we just added
          const rollback = r.lastCompletedDate === today ? Math.max(0, r.streakCount - 1) : r.streakCount;
          return {
            ...r,
            isCompleted: false,
            lastCompletedDate: r.lastCompletedDate === today ? yest : r.lastCompletedDate,
            streakCount: rollback,
          };
        }),
      };
    });
  }, []);

  const addRoutine = useCallback((data: Omit<Routine, "id" | "isCompleted" | "streakCount" | "order">) => {
    setState((s) => {
      const sectionRoutines = s.routines.filter((r) => r.sectionId === data.sectionId);
      const order = sectionRoutines.length;
      return {
        ...s,
        routines: [...s.routines, { ...data, id: uid(), isCompleted: false, streakCount: 0, order }],
      };
    });
  }, []);

  const updateRoutine = useCallback((id: string, patch: Partial<Routine>) => {
    setState((s) => ({ ...s, routines: s.routines.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  }, []);

  const deleteRoutine = useCallback((id: string) => {
    setState((s) => ({ ...s, routines: s.routines.filter((r) => r.id !== id) }));
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

  const addSection = useCallback((title: string, emoji?: string) => {
    setState((s) => ({
      ...s,
      sections: [...s.sections, { id: uid(), title, emoji, collapsed: false, order: s.sections.length }],
    }));
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

  const completed = state.routines.filter((r) => r.isCompleted).length;
  const total = state.routines.length;

  return {
    state,
    completed,
    total,
    toggleRoutine,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    reorderRoutine,
    addSection,
    updateSection,
    deleteSection,
    toggleSectionCollapsed,
  };
};
