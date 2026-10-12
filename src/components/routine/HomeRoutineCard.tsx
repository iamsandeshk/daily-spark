import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import type { Routine } from "@/lib/routine-types";
import { getRoutineColor } from "@/lib/routine-colors";
import { RoutineIcon } from "./RoutineIcon";
import { completionHaptic, tapHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type Props = {
  routine: Routine;
  onOpen: () => void;
  onToggleComplete: () => void;
};

export const HomeRoutineCard: React.FC<Props> = ({
  routine,
  onOpen,
  onToggleComplete,
}) => {
  const color = getRoutineColor(routine);
  const isDone = !!routine.isCompleted;
  const [justCompleted, setJustCompleted] = useState(false);

  // Subtle accent tint concentrated on the left edge only (no neon glow blobs)
  const localizedGlow = {
    background: isDone
      ? "radial-gradient(circle at 6% 50%, rgba(34, 197, 94, 0.06) 0%, transparent 45%), #161618"
      : `radial-gradient(circle at 6% 50%, ${color.glow || "rgba(168, 85, 247, 0.12)"} 0%, transparent 45%), #161618`,
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDone) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 800);
      completionHaptic();
    } else {
      tapHaptic();
    }
    onToggleComplete();
  };

  return (
    <motion.div
      layout="position"
      onClick={() => {
        tapHaptic();
        onOpen();
      }}
      className={cn(
        "group relative flex items-center justify-between px-5 py-4.5 min-h-[82px] rounded-[28px] border border-white/[0.08] cursor-pointer overflow-hidden transition-all duration-200 select-none",
        isDone ? "opacity-75 hover:opacity-90" : "hover:border-white/15",
      )}
      style={localizedGlow}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.18 }}
    >
      {/* Left side: Icon + Title */}
      <div className="flex items-center gap-4 min-w-0 pr-3">
        {/* Clean Routine Icon */}
        <div
          className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-opacity",
            isDone ? "opacity-50" : "opacity-100",
          )}
        >
          <RoutineIcon routine={routine} size={22} />
        </div>

        {/* Title + optional streak indicator */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "text-[18px] font-semibold tracking-tight truncate transition-all duration-200",
              isDone
                ? "line-through text-white/40 decoration-white/30"
                : "text-white",
            )}
          >
            {routine.title}
          </span>

          {/* Streak indicator if streak > 0 */}
          {routine.streakCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-orange-400 shrink-0">
              <span>🔥</span>
              <span>{routine.streakCount}</span>
            </span>
          )}
        </div>
      </div>

      {/* Right side: Circular Completion Control */}
      <div className="relative shrink-0 flex items-center justify-center">
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isDone ? `Mark ${routine.title} incomplete` : `Mark ${routine.title} complete`}
          className={cn(
            "relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90",
            isDone
              ? "bg-[#22c55e] text-white shadow-sm"
              : "border-2 border-dashed border-white/20 text-white/30 hover:border-white/35",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isDone ? (
              <motion.div
                key="checked"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 30 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                className="flex items-center justify-center"
              >
                <Check size={18} strokeWidth={3} className="text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="unchecked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center"
              >
                <Check size={16} strokeWidth={2.4} className="opacity-30 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Small subtle ripple burst on completion */}
        {justCompleted && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0.9 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border-2 border-[#22c55e] pointer-events-none"
          />
        )}
      </div>
    </motion.div>
  );
};
