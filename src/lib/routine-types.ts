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

export type RoutineState = {
  sections: Section[];
  routines: Routine[];
  lastResetDate: string; // YYYY-MM-DD
};
