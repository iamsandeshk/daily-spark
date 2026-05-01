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
    sections: [
      { id: "s-morning", title: "Morning", emoji: "🌅", collapsed: false, order: 0 },
      { id: "s-work", title: "Work", emoji: "💼", collapsed: false, order: 1 },
      { id: "s-night", title: "Night", emoji: "🌙", collapsed: false, order: 2 },
    ],
    routines: [
      { id: "r1", title: "Drink a glass of water", emoji: "💧", isCompleted: false, streakCount: 0, sectionId: "s-morning", order: 0 },
      { id: "r2", title: "10 minutes meditation", description: "Calm before the storm", emoji: "🧘", isCompleted: false, streakCount: 0, sectionId: "s-morning", order: 1 },
      { id: "r3", title: "Plan top 3 tasks", emoji: "🎯", isCompleted: false, streakCount: 0, sectionId: "s-work", order: 0 },
      { id: "r4", title: "Deep work block", description: "90 minutes, no notifications", emoji: "📚", isCompleted: false, streakCount: 0, sectionId: "s-work", order: 1 },
      { id: "r5", title: "Read 20 pages", emoji: "📖", isCompleted: false, streakCount: 0, sectionId: "s-night", order: 0 },
      { id: "r6", title: "Reflect on the day", emoji: "✨", isCompleted: false, streakCount: 0, sectionId: "s-night", order: 1 },
    ],
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
    snap[r.id] = { title: r.title, emoji: r.emoji, sectionTitle: sectionMap[r.sectionId] };
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

  // Detect unfinished checkbox blocks for carry-forward prompt
  const carryItems: { routineId: string; blockIds: string[] }[] = [];
  for (const r of state.routines) {
    const unfinished = (r.blocks ?? [])
      .filter((b) => b.type === "checkbox" && b.text?.trim() && !b.checked)
      .map((b) => b.id);
    if (unfinished.length > 0) {
      carryItems.push({ routineId: r.id, blockIds: unfinished });
    }
  }

  const yesterday = yesterdayKey(today);
  const routines = state.routines.map((r) => {
    const keepStreak = r.lastCompletedDate === yesterday || r.lastCompletedDate === today;
    return {
      ...r,
      isCompleted: false,
      streakCount: keepStreak ? r.streakCount : 0,
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
