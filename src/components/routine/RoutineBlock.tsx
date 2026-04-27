import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Flame, Trash2 } from "lucide-react";
import type { Routine } from "@/lib/routine-types";
import { RoutineCheckbox } from "./RoutineCheckbox";
import { successHaptic, tapHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type Props = {
  routine: Routine;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  isFirst: boolean;
  isLast: boolean;
};

export const RoutineBlock = ({ routine, onToggle, onDelete, onMove, isFirst, isLast }: Props) => {
  const handleToggle = () => {
    if (!routine.isCompleted) successHaptic();
    else tapHaptic();
    onToggle(routine.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "group relative flex items-start gap-3 rounded-xl border border-border bg-card px-3.5 py-3 shadow-block transition-smooth",
        routine.isCompleted && "bg-success-soft/40 border-success/20",
      )}
    >
      <div className="pt-0.5">
        <RoutineCheckbox checked={routine.isCompleted} onChange={handleToggle} />
      </div>

      <button
        type="button"
        onClick={handleToggle}
        className="flex-1 min-w-0 text-left"
      >
        <div className="flex items-center gap-2">
          {routine.emoji && <span className="text-base leading-none">{routine.emoji}</span>}
          <span
            className={cn(
              "font-medium text-[15px] leading-snug transition-smooth",
              routine.isCompleted && "line-through text-muted-foreground",
            )}
          >
            {routine.title}
          </span>
        </div>
        {routine.description && (
          <p className="mt-0.5 text-[13px] text-muted-foreground line-clamp-2">{routine.description}</p>
        )}
      </button>

      <div className="flex items-center gap-1.5 pt-0.5">
        {routine.streakCount > 0 && (
          <div
            className="flex items-center gap-0.5 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent"
            title={`${routine.streakCount} day streak`}
          >
            <Flame size={12} strokeWidth={2.5} />
            {routine.streakCount}
          </div>
        )}
        <div className="hidden group-hover:flex items-center gap-0.5">
          <button
            onClick={() => onMove(routine.id, "up")}
            disabled={isFirst}
            className="p-1 rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
            aria-label="Move up"
          >
            <ArrowUp size={13} />
          </button>
          <button
            onClick={() => onMove(routine.id, "down")}
            disabled={isLast}
            className="p-1 rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
            aria-label="Move down"
          >
            <ArrowDown size={13} />
          </button>
          <button
            onClick={() => onDelete(routine.id)}
            className="p-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
