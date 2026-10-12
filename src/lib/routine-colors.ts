export type RoutineColorId =
  | "orange"
  | "purple"
  | "blue"
  | "emerald"
  | "rose"
  | "amber"
  | "teal"
  | "indigo";

export type RoutineColor = {
  id: RoutineColorId;
  name: string;
  hex: string;
  bgLight: string;
  borderLight: string;
  glow: string;
  accentClass: string;
  chipClass: string;
  gradient: string;
};

export const ROUTINE_COLORS: RoutineColor[] = [
  {
    id: "orange",
    name: "Sunset Orange",
    hex: "#f97316",
    bgLight: "rgba(249, 115, 22, 0.12)",
    borderLight: "rgba(249, 115, 22, 0.25)",
    glow: "rgba(249, 115, 22, 0.20)",
    accentClass: "text-orange-500",
    chipClass: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    gradient: "from-orange-500/20 to-orange-500/5",
  },
  {
    id: "purple",
    name: "Electric Violet",
    hex: "#a855f7",
    bgLight: "rgba(168, 85, 247, 0.12)",
    borderLight: "rgba(168, 85, 247, 0.25)",
    glow: "rgba(168, 85, 247, 0.20)",
    accentClass: "text-purple-500",
    chipClass: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    gradient: "from-purple-500/20 to-purple-500/5",
  },
  {
    id: "blue",
    name: "Sky Blue",
    hex: "#3b82f6",
    bgLight: "rgba(59, 130, 246, 0.12)",
    borderLight: "rgba(59, 130, 246, 0.25)",
    glow: "rgba(59, 130, 246, 0.20)",
    accentClass: "text-blue-500",
    chipClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    gradient: "from-blue-500/20 to-blue-500/5",
  },
  {
    id: "emerald",
    name: "Emerald Green",
    hex: "#10b981",
    bgLight: "rgba(16, 185, 129, 0.12)",
    borderLight: "rgba(16, 185, 129, 0.25)",
    glow: "rgba(16, 185, 129, 0.20)",
    accentClass: "text-emerald-500",
    chipClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    id: "rose",
    name: "Rose Red",
    hex: "#f43f5e",
    bgLight: "rgba(244, 63, 94, 0.12)",
    borderLight: "rgba(244, 63, 94, 0.25)",
    glow: "rgba(244, 63, 94, 0.20)",
    accentClass: "text-rose-500",
    chipClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    gradient: "from-rose-500/20 to-rose-500/5",
  },
  {
    id: "amber",
    name: "Warm Amber",
    hex: "#f59e0b",
    bgLight: "rgba(245, 158, 11, 0.12)",
    borderLight: "rgba(245, 158, 11, 0.25)",
    glow: "rgba(245, 158, 11, 0.20)",
    accentClass: "text-amber-500",
    chipClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    gradient: "from-amber-500/20 to-amber-500/5",
  },
  {
    id: "teal",
    name: "Lagoon Teal",
    hex: "#14b8a6",
    bgLight: "rgba(20, 184, 166, 0.12)",
    borderLight: "rgba(20, 184, 166, 0.25)",
    glow: "rgba(20, 184, 166, 0.20)",
    accentClass: "text-teal-500",
    chipClass: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    gradient: "from-teal-500/20 to-teal-500/5",
  },
  {
    id: "indigo",
    name: "Deep Indigo",
    hex: "#6366f1",
    bgLight: "rgba(99, 102, 241, 0.12)",
    borderLight: "rgba(99, 102, 241, 0.25)",
    glow: "rgba(99, 102, 241, 0.20)",
    accentClass: "text-indigo-500",
    chipClass: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    gradient: "from-indigo-500/20 to-indigo-500/5",
  },
];

export const getRoutineColor = (routine?: { id?: string; color?: string; order?: number }): RoutineColor => {
  if (routine?.color) {
    const found = ROUTINE_COLORS.find(
      (c) => c.id === routine.color || c.hex.toLowerCase() === routine.color?.toLowerCase(),
    );
    if (found) return found;
  }

  // Deterministic fallback based on routine id or order
  if (routine?.id) {
    let hash = 0;
    for (let i = 0; i < routine.id.length; i++) {
      hash = (hash << 5) - hash + routine.id.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % ROUTINE_COLORS.length;
    return ROUTINE_COLORS[index];
  }

  const orderIndex = Math.abs(routine?.order ?? 0) % ROUTINE_COLORS.length;
  return ROUTINE_COLORS[orderIndex];
};
