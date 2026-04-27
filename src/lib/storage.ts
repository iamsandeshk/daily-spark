import type { RoutineState } from "./routine-types";

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
    return applyDailyReset(JSON.parse(raw) as RoutineState);
  } catch {
    return applyDailyReset(seed());
  }
};

export const saveState = (s: RoutineState) => {
  localStorage.setItem(KEY, JSON.stringify(s));
};

/**
 * Daily reset engine.
 * - Compares lastResetDate with today (local time)
 * - Resets all isCompleted to false
 * - Breaks streaks for routines not completed yesterday (or earlier)
 * - Idempotent: only runs once per local day
 * - Survives device restart, app close, timezone changes
 */
export const applyDailyReset = (state: RoutineState): RoutineState => {
  const today = todayKey();
  if (state.lastResetDate === today) return state;

  const yesterday = yesterdayKey(today);
  const routines = state.routines.map((r) => {
    // If their last completion was not yesterday and not today, streak resets
    const keepStreak = r.lastCompletedDate === yesterday || r.lastCompletedDate === today;
    return {
      ...r,
      isCompleted: false,
      streakCount: keepStreak ? r.streakCount : 0,
    };
  });

  const next: RoutineState = { ...state, routines, lastResetDate: today };
  saveState(next);
  return next;
};
