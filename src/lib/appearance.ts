// Pro appearance — font family + layout density.
// Stored in localStorage and applied to <html> via CSS variables + classes.

export type FontId =
  | "default"
  | "manrope"
  | "inter-tight"
  | "sora"
  | "lora"
  | "space-mono"
  | "doto"
  | "silkscreen";

export type DensityId = "compact" | "cozy" | "spacious";

export const FONTS: { id: FontId; name: string; family: string; sample: string; pro: boolean }[] = [
  { id: "default",     name: "Default",     family: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", sample: "Aa", pro: false },
  { id: "manrope",     name: "Manrope",     family: "'Manrope', ui-sans-serif, sans-serif", sample: "Aa", pro: true },
  { id: "inter-tight", name: "Inter Tight", family: "'Inter Tight', ui-sans-serif, sans-serif", sample: "Aa", pro: true },
  { id: "sora",        name: "Sora",        family: "'Sora', ui-sans-serif, sans-serif", sample: "Aa", pro: true },
  { id: "lora",        name: "Lora",        family: "'Lora', Georgia, serif", sample: "Aa", pro: true },
  { id: "space-mono",  name: "Space Mono",  family: "'Space Mono', ui-monospace, monospace", sample: "Aa", pro: true },
  { id: "doto",        name: "Nothing Dot", family: "'Doto', 'Silkscreen', ui-monospace, monospace", sample: "Aa", pro: true },
  { id: "silkscreen",  name: "Pixel",       family: "'Silkscreen', 'Doto', ui-monospace, monospace", sample: "Aa", pro: true },
];

export const DENSITIES: { id: DensityId; name: string; hint: string }[] = [
  { id: "compact",   name: "Compact",   hint: "Tighter spacing" },
  { id: "cozy",      name: "Cozy",      hint: "Default balance" },
  { id: "spacious",  name: "Spacious",  hint: "More breathing room" },
];

const FONT_KEY = "app-font";
const DENS_KEY = "app-density";

export const getFont = (): FontId => {
  const v = localStorage.getItem(FONT_KEY) as FontId | null;
  return v && FONTS.some((f) => f.id === v) ? v : "default";
};
export const getDensity = (): DensityId => {
  const v = localStorage.getItem(DENS_KEY) as DensityId | null;
  return v && DENSITIES.some((d) => d.id === v) ? v : "cozy";
};

export const setFont = (id: FontId) => {
  localStorage.setItem(FONT_KEY, id);
  applyAppearance();
  window.dispatchEvent(new Event("appearance:updated"));
};
export const setDensity = (id: DensityId) => {
  localStorage.setItem(DENS_KEY, id);
  applyAppearance();
  window.dispatchEvent(new Event("appearance:updated"));
};

export const applyAppearance = () => {
  const root = document.documentElement;
  const font = FONTS.find((f) => f.id === getFont()) ?? FONTS[0];
  root.style.setProperty("--app-font", font.family);

  const density = getDensity();
  root.classList.remove("density-compact", "density-cozy", "density-spacious");
  root.classList.add(`density-${density}`);
};
