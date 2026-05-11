import { useEffect, useState } from "react";
import type { BlockType } from "./routine-types";

export type ToolbarItem = { type: BlockType; enabled: boolean };

const KEY = "toolbar-customization/v1";

export const DEFAULT_TOOLBAR: ToolbarItem[] = [
  { type: "text", enabled: true },
  { type: "heading", enabled: true },
  { type: "subheading", enabled: true },
  { type: "checkbox", enabled: true },
  { type: "timer", enabled: true },
  { type: "bullet", enabled: true },
  { type: "routine", enabled: true },
  { type: "link", enabled: true },
  { type: "divider", enabled: true },
  { type: "quote", enabled: true },
];

export const BLOCK_LABELS: Record<BlockType, string> = {
  text: "Text",
  heading: "Heading",
  subheading: "Subheading",
  checkbox: "To-do",
  timer: "Timer",
  bullet: "Bullet list",
  routine: "Routine",
  link: "Link",
  divider: "Divider",
  quote: "Quote",
};

export const loadToolbar = (): ToolbarItem[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_TOOLBAR;
    const parsed = JSON.parse(raw) as ToolbarItem[];
    if (!Array.isArray(parsed)) return DEFAULT_TOOLBAR;
    // Merge in any newly added types (so future additions auto-appear).
    const known = new Set(parsed.map((i) => i.type));
    const merged = [...parsed.filter((i) => i && i.type)];
    for (const def of DEFAULT_TOOLBAR) {
      if (!known.has(def.type)) merged.push(def);
    }
    return merged;
  } catch {
    return DEFAULT_TOOLBAR;
  }
};

export const saveToolbar = (items: ToolbarItem[]) => {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("toolbar:updated"));
};

export const useToolbar = () => {
  const [items, setItems] = useState<ToolbarItem[]>(() => loadToolbar());
  useEffect(() => {
    const sync = () => setItems(loadToolbar());
    window.addEventListener("toolbar:updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("toolbar:updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return {
    items,
    setItems: (next: ToolbarItem[]) => {
      setItems(next);
      saveToolbar(next);
    },
  };
};
