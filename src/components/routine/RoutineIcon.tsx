import React from "react";
import {
  Bed,
  Sunrise,
  Sunset,
  BookOpen,
  Eye,
  Heart,
  Dumbbell,
  Sparkles,
  Droplets,
  Coffee,
  CheckCircle2,
  Smile,
  Timer,
  Zap,
} from "lucide-react";
import type { Routine } from "@/lib/routine-types";
import { getRoutineColor } from "@/lib/routine-colors";

type Props = {
  routine: Routine;
  size?: number;
  className?: string;
};

export const RoutineIcon: React.FC<Props> = ({ routine, size = 20, className = "" }) => {
  const color = getRoutineColor(routine);
  const title = (routine.title || "").toLowerCase();
  const emoji = routine.emoji;

  // If title or emoji matches common routine themes, render modern Lucide icon
  // matching the Reference screenshots (Bed, Sunrise, Eye, BookOpen, etc.)
  if (title.includes("sleep") || emoji === "🛏️" || emoji === "🛌" || emoji === "🌙") {
    return <Bed size={size} className={className || color.accentClass} />;
  }
  if (title.includes("wake") || emoji === "🌅" || emoji === "☀️" || emoji === "🌞") {
    return <Sunrise size={size} className={className || color.accentClass} />;
  }
  if (title.includes("read") || title.includes("book") || emoji === "📖" || emoji === "📚") {
    return <BookOpen size={size} className={className || color.accentClass} />;
  }
  if (title.includes("vision") || title.includes("eye") || emoji === "👁️" || emoji === "👀") {
    return <Eye size={size} className={className || color.accentClass} />;
  }
  if (title.includes("meditat") || emoji === "🧘" || emoji === "🧘‍♂️" || emoji === "🧘‍♀️") {
    return <Sparkles size={size} className={className || color.accentClass} />;
  }
  if (title.includes("workout") || title.includes("gym") || title.includes("fit") || emoji === "💪" || emoji === "🏋️") {
    return <Dumbbell size={size} className={className || color.accentClass} />;
  }
  if (title.includes("water") || title.includes("hydrat") || emoji === "💧" || emoji === "🚰") {
    return <Droplets size={size} className={className || color.accentClass} />;
  }
  if (title.includes("coffee") || title.includes("tea") || emoji === "☕") {
    return <Coffee size={size} className={className || color.accentClass} />;
  }

  // If routine has an emoji, render it with crisp typography
  if (emoji && emoji.trim()) {
    return (
      <span
        style={{ fontSize: size }}
        className={`leading-none select-none flex items-center justify-center ${className}`}
      >
        {emoji}
      </span>
    );
  }

  // Fallback to sparkles / accent icon
  return <Sparkles size={size} className={className || color.accentClass} />;
};
