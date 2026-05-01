export type BlockType =
  | "text"
  | "heading"
  | "subheading"
  | "bullet"
  | "checkbox"
  | "divider"
  | "quote"
  | "link"
  | "routine";

export type RoutineBlockContent = {
  id: string;
  type: BlockType;
  text?: string;
  checked?: boolean;
  url?: string;
  linkedRoutineId?: string;
};

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
  /** Notion-style rich content blocks (optional for legacy routines). */
  blocks?: RoutineBlockContent[];
  collapsed?: boolean;
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
  snapshot: Record<string, { title: string; emoji?: string; sectionTitle?: string; blocks?: RoutineBlockContent[] }>;
  total: number;
};

export type MoodValue = "great" | "ok" | "tired" | "stressed";

export type CarryForwardItem = {
  routineId: string;
  blockIds: string[]; // unfinished checkbox block ids from the previous day
};

export type RoutineState = {
  sections: Section[];
  routines: Routine[];
  lastResetDate: string; // YYYY-MM-DD
  history: Record<string, DayHistory>; // keyed by date
  /** Unfinished checkboxes from the most recent ended day awaiting user decision. */
  pendingCarryForward?: {
    fromDate: string;
    items: CarryForwardItem[];
  };
  /** Daily mood entries keyed by date (YYYY-MM-DD). */
  moods?: Record<string, MoodValue>;
};
