// Pro color themes — override accent / ring CSS variables on :root.
// Each theme provides light + dark HSL triplets for --accent and --accent-soft.

export type ColorThemeId =
  | "default"
  | "orange"
  | "green"
  | "yellow"
  | "blue"
  | "purple"
  | "pink"
  | "red"
  | "teal"
  | "rose";

export type ColorTheme = {
  id: ColorThemeId;
  name: string;
  swatch: string; // hex for preview swatch
  pro: boolean;
  light: { accent: string; accentSoft: string; accentFg: string };
  dark: { accent: string; accentSoft: string; accentFg: string };
};

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: "default",
    name: "Default",
    swatch: "#f97316",
    pro: false,
    light: { accent: "25 95% 58%", accentSoft: "25 95% 96%", accentFg: "0 0% 100%" },
    dark:  { accent: "25 95% 60%", accentSoft: "25 40% 18%", accentFg: "30 8% 8%" },
  },
  {
    id: "orange",
    name: "Sunset Orange",
    swatch: "#fb923c",
    pro: false,
    light: { accent: "20 100% 55%", accentSoft: "20 100% 96%", accentFg: "0 0% 100%" },
    dark:  { accent: "20 100% 60%", accentSoft: "20 50% 16%", accentFg: "30 8% 8%" },
  },
  {
    id: "green",
    name: "Forest Green",
    swatch: "#22c55e",
    pro: true,
    light: { accent: "142 65% 42%", accentSoft: "142 55% 94%", accentFg: "0 0% 100%" },
    dark:  { accent: "142 60% 50%", accentSoft: "142 40% 16%", accentFg: "30 8% 8%" },
  },
  {
    id: "yellow",
    name: "Mellow Yellow",
    swatch: "#eab308",
    pro: true,
    light: { accent: "42 95% 50%", accentSoft: "42 95% 95%", accentFg: "30 10% 15%" },
    dark:  { accent: "42 95% 58%", accentSoft: "42 40% 16%", accentFg: "30 8% 8%" },
  },
  {
    id: "blue",
    name: "Ocean Blue",
    swatch: "#3b82f6",
    pro: true,
    light: { accent: "217 90% 56%", accentSoft: "217 95% 96%", accentFg: "0 0% 100%" },
    dark:  { accent: "217 90% 62%", accentSoft: "217 40% 18%", accentFg: "30 8% 8%" },
  },
  {
    id: "purple",
    name: "Royal Purple",
    swatch: "#a855f7",
    pro: true,
    light: { accent: "271 76% 56%", accentSoft: "271 76% 96%", accentFg: "0 0% 100%" },
    dark:  { accent: "271 76% 65%", accentSoft: "271 40% 20%", accentFg: "30 8% 8%" },
  },
  {
    id: "pink",
    name: "Cherry Pink",
    swatch: "#ec4899",
    pro: true,
    light: { accent: "330 80% 58%", accentSoft: "330 80% 96%", accentFg: "0 0% 100%" },
    dark:  { accent: "330 80% 65%", accentSoft: "330 40% 20%", accentFg: "30 8% 8%" },
  },
  {
    id: "red",
    name: "Ember Red",
    swatch: "#ef4444",
    pro: true,
    light: { accent: "0 78% 55%", accentSoft: "0 78% 96%", accentFg: "0 0% 100%" },
    dark:  { accent: "0 78% 62%", accentSoft: "0 40% 20%", accentFg: "30 8% 8%" },
  },
  {
    id: "teal",
    name: "Lagoon Teal",
    swatch: "#14b8a6",
    pro: true,
    light: { accent: "172 70% 40%", accentSoft: "172 70% 94%", accentFg: "0 0% 100%" },
    dark:  { accent: "172 70% 50%", accentSoft: "172 40% 16%", accentFg: "30 8% 8%" },
  },
  {
    id: "rose",
    name: "Dusty Rose",
    swatch: "#fb7185",
    pro: true,
    light: { accent: "350 85% 62%", accentSoft: "350 85% 96%", accentFg: "0 0% 100%" },
    dark:  { accent: "350 85% 68%", accentSoft: "350 40% 20%", accentFg: "30 8% 8%" },
  },
];

const KEY = "color-theme";

export const getColorTheme = (): ColorThemeId => {
  const saved = localStorage.getItem(KEY) as ColorThemeId | null;
  if (saved && COLOR_THEMES.some((t) => t.id === saved)) return saved;
  return "default";
};

export const setColorTheme = (id: ColorThemeId) => {
  localStorage.setItem(KEY, id);
  applyColorTheme(id);
  window.dispatchEvent(new Event("color-theme:updated"));
};

// Reset to the free default theme if the current selection is Pro-only.
export const enforceFreeColorTheme = () => {
  const theme = COLOR_THEMES.find((t) => t.id === getColorTheme());
  if (theme?.pro) setColorTheme("default");
};

export const applyColorTheme = (id: ColorThemeId = getColorTheme()) => {
  const theme = COLOR_THEMES.find((t) => t.id === id) ?? COLOR_THEMES[0];
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  const palette = isDark ? theme.dark : theme.light;
  root.style.setProperty("--accent", palette.accent);
  root.style.setProperty("--accent-soft", palette.accentSoft);
  root.style.setProperty("--accent-foreground", palette.accentFg);
  root.style.setProperty("--ring", palette.accent);
};
