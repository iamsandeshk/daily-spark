// Per-mood emoji + display name customization.
// Stored in localStorage; defaults match the original mood set.

import type { MoodValue } from "./routine-types";

export type MoodConfigItem = { emoji: string; name: string };
export type MoodConfig = Record<MoodValue, MoodConfigItem>;

export const MOOD_DEFAULTS: MoodConfig = {
  great:    { emoji: "🙂", name: "Great" },
  ok:       { emoji: "😐", name: "OK" },
  tired:    { emoji: "😴", name: "Tired" },
  stressed: { emoji: "😫", name: "Stressed" },
};

export const MOOD_ORDER: MoodValue[] = ["great", "ok", "tired", "stressed"];

const KEY = "mood-config";

export const getMoodConfig = (): MoodConfig => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...MOOD_DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<MoodConfig>;
    const merged: MoodConfig = { ...MOOD_DEFAULTS };
    for (const k of MOOD_ORDER) {
      if (parsed[k]) {
        merged[k] = {
          emoji: parsed[k]?.emoji || MOOD_DEFAULTS[k].emoji,
          name:  parsed[k]?.name  || MOOD_DEFAULTS[k].name,
        };
      }
    }
    return merged;
  } catch {
    return { ...MOOD_DEFAULTS };
  }
};

export const setMoodConfigItem = (mood: MoodValue, patch: Partial<MoodConfigItem>) => {
  const cur = getMoodConfig();
  cur[mood] = { ...cur[mood], ...patch };
  localStorage.setItem(KEY, JSON.stringify(cur));
  window.dispatchEvent(new Event("mood-config:updated"));
};

export const resetMoodConfig = () => {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("mood-config:updated"));
};
