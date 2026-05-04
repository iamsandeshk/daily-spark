import type { DayHistory, RoutineState } from "./routine-types";

const KEY = "daily-routine-os/v1";

export const todayKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const yesterdayKey = (today = todayKey()) => {
  const d = new Date(today + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return todayKey(d);
};

const seed = (): RoutineState => {
  const today = todayKey();
  return {
    lastResetDate: today,
    history: {},
    sections: [],
    routines: [],
  };
};

export const loadState = (): RoutineState => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return applyDailyReset(seed());
    const parsed = JSON.parse(raw) as RoutineState;
    if (!parsed.history) parsed.history = {};
    return applyDailyReset(parsed);
  } catch {
    return applyDailyReset(seed());
  }
};

export const saveState = (s: RoutineState) => {
  localStorage.setItem(KEY, JSON.stringify(s));
};

const snapshotForDate = (state: RoutineState): DayHistory["snapshot"] => {
  const sectionMap = Object.fromEntries(state.sections.map((s) => [s.id, s.title]));
  const snap: DayHistory["snapshot"] = {};
  for (const r of state.routines) {
    snap[r.id] = {
      title: r.title,
      emoji: r.emoji,
      sectionTitle: sectionMap[r.sectionId],
      blocks: r.blocks,
    };
  }
  return snap;
};

/**
 * Daily reset engine — also persists yesterday's completion record into history.
 * If the ending day had unfinished checkbox tasks, record a `pendingCarryForward`
 * so the user can decide (Smart Carry Forward).
 */
export const applyDailyReset = (state: RoutineState): RoutineState => {
  const today = todayKey();
  if (state.lastResetDate === today) return state;

  // Save snapshot of the day that's ending (state.lastResetDate)
  const endingDate = state.lastResetDate;
  const completedIds = state.routines.filter((r) => r.isCompleted).map((r) => r.id);
  const history = { ...state.history };
  if (endingDate) {
    history[endingDate] = {
      date: endingDate,
      completedRoutineIds: completedIds,
      snapshot: snapshotForDate(state),
      total: state.routines.length,
    };
  }

  // Detect unfinished checkbox blocks for carry-forward prompt.
  // Snapshot the streak BEFORE reset so we can restore it if the user accepts.
  const carryItems: { routineId: string; blockIds: string[]; preservedStreak?: number; preservedLastCompletedDate?: string }[] = [];
  for (const r of state.routines) {
    const unfinished = (r.blocks ?? [])
      .filter((b) => b.type === "checkbox" && b.text?.trim() && !b.checked)
      .map((b) => b.id);
    if (unfinished.length > 0) {
      carryItems.push({
        routineId: r.id,
        blockIds: unfinished,
        preservedStreak: r.streakCount,
        preservedLastCompletedDate: r.lastCompletedDate,
      });
    }
  }

  const yesterday = yesterdayKey(today);
  const routines = state.routines.map((r) => {
    const keepStreak = r.lastCompletedDate === yesterday || r.lastCompletedDate === today;
    return {
      ...r,
      isCompleted: false,
      streakCount: keepStreak ? r.streakCount : 0,
      blocks: (r.blocks ?? []).map((b) =>
        b.type === "checkbox" ? { ...b, checked: false } : b
      ),
    };
  });

  const next: RoutineState = {
    ...state,
    routines,
    lastResetDate: today,
    history,
    pendingCarryForward:
      carryItems.length > 0 && endingDate
        ? { fromDate: endingDate, items: carryItems }
        : undefined,
  };
  saveState(next);
  return next;
};

/** Live snapshot of today's history (for showing today in calendar before reset). */
export const todayLiveHistory = (state: RoutineState): DayHistory => {
  const today = todayKey();
  return {
    date: today,
    completedRoutineIds: state.routines.filter((r) => r.isCompleted).map((r) => r.id),
    snapshot: snapshotForDate(state),
    total: state.routines.length,
  };
};
