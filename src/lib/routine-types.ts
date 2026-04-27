export type Routine = {
  id: string;
  title: string;
  description?: string;
  emoji?: string;
  isCompleted: boolean;
  lastCompletedDate?: string; // YYYY-MM-DD
  streakCount: number;
  sectionId: string;
  order: number;
};

export type Section = {
  id: string;
  title: string;
  emoji?: string;
  collapsed: boolean;
  order: number;
};

export type DayHistory = {
  date: string; // YYYY-MM-DD
  completedRoutineIds: string[];
  // Snapshot of routine titles/emoji at the time, so old days survive deletes
  snapshot: Record<string, { title: string; emoji?: string; sectionTitle?: string }>;
  total: number;
};

export type RoutineState = {
  sections: Section[];
  routines: Routine[];
  lastResetDate: string; // YYYY-MM-DD
  history: Record<string, DayHistory>; // keyed by date
};
