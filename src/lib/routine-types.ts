export type BlockType =
  | "text"
  | "heading"
  | "subheading"
  | "bullet"
  | "checkbox"
  | "divider"
  | "quote"
  | "link"
  | "routine"
  | "timer";

export type RoutineBlockContent = {
  id: string;
  type: BlockType;
  text?: string;
  checked?: boolean;
  url?: string;
  linkedRoutineId?: string;
  /** For timer blocks: duration in seconds. */
  durationSeconds?: number;
  /** Timer: epoch ms when the timer is scheduled to hit 0. Set only while running. */
  timerEndAt?: number;
  /** Timer: seconds remaining when paused. Undefined = idle (full duration). */
  timerPausedRemaining?: number;
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
  /** User-archived: hidden from home, kept for unarchive. */
  archived?: boolean;
  /** Schedule (YYYY-MM-DD). Routine is hidden before startDate / after endDate. */
  startDate?: string;
  endDate?: string;
  /** Per-routine override for daily reset time. */
  resetHour?: number;
  resetMinute?: number;
  /** Tracks last per-routine reset (YYYY-MM-DD using its own offset). */
  routineLastResetDate?: string;
  /** When true, completed tasks stay checked across daily reset. */
  disableDailyReset?: boolean;
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
  /** Streak snapshot at the time of carry-forward, restored if user accepts. */
  preservedStreak?: number;
  /** lastCompletedDate snapshot at the time of carry-forward. */
  preservedLastCompletedDate?: string;
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
  /** Dates when carry-forward popup was shown (limit 2/month). */
  carryForwardShownDates?: string[];
  settings?: AppSettings;
};

export type AppSettings = {
  /** Hour-of-day (0-23) when the daily reset should happen. Default 0 (midnight). */
  resetHour?: number;
  /** Minute-of-hour (0-59) when the daily reset should happen. Default 0. */
  resetMinute?: number;
  /** 0 = Sunday, 1 = Monday. */
  startOfWeek?: 0 | 1;
  /** Target consecutive-days streak goal. */
  streakGoal?: number;
  /** Daily reminder toggle. */
  dailyReminder?: boolean;
  /** Reminder hour (0-23). */
  reminderHour?: number;
  /** Reminder minute (0-59). */
  reminderMinute?: number;
  /** Streak reminders toggle. */
  streakReminder?: boolean;
  /** Completion celebration toggle. */
  completionCelebration?: boolean;
};
