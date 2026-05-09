import { useEffect, useRef, useState } from "react";
import { Pause, Play, Lock, Timer as TimerIcon, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { successHaptic, tapHaptic } from "@/lib/haptics";
import { RoutineCheckbox } from "./RoutineCheckbox";
import { DurationPicker } from "./DurationPicker";
import type { RoutineBlockContent } from "@/lib/routine-types";

export const formatTime = (s: number) => {
  const total = Math.max(0, Math.ceil(s));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

type Variant = "editor" | "home";

type Props = {
  block: RoutineBlockContent;
  prevTasksComplete: boolean;
  variant: Variant;
  /** Whether the title input is editable (only for editor variant). */
  editable?: boolean;
  onUpdate: (patch: Partial<RoutineBlockContent>) => void;
};

export const TimerRow = ({ block, prevTasksComplete, variant, editable = false, onUpdate }: Props) => {
  const duration = block.durationSeconds ?? 60;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [, force] = useState(0);
  const completedRef = useRef(false);

  const running = !!block.timerEndAt && !block.checked;
  const paused = block.timerPausedRemaining !== undefined && !running;

  const computeRemaining = () => {
    if (block.checked) return 0;
    if (running && block.timerEndAt) {
      return Math.max(0, Math.ceil((block.timerEndAt - Date.now()) / 1000));
    }
    if (paused && typeof block.timerPausedRemaining === "number") {
      return block.timerPausedRemaining;
    }
    return duration;
  };
  const remaining = computeRemaining();

  // Tick UI while running
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => force((n) => n + 1), 500);
    return () => window.clearInterval(id);
  }, [running]);

  // Auto-complete when remaining hits 0
  useEffect(() => {
    if (block.checked) {
      completedRef.current = false;
      return;
    }
    if (running && remaining <= 0 && !completedRef.current) {
      completedRef.current = true;
      successHaptic();
      onUpdate({ checked: true, timerEndAt: undefined, timerPausedRemaining: undefined });
      toast.success(`${block.text || "Timer"} complete!`, { description: "Task auto-completed." });
    }
  }, [running, remaining, block.checked]);

  // Auto-start when previous tasks just became complete
  useEffect(() => {
    if (prevTasksComplete && !block.checked && !running && !paused) {
      onUpdate({ timerEndAt: Date.now() + duration * 1000, timerPausedRemaining: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevTasksComplete, block.checked]);

  // If prev becomes incomplete while running, pause
  useEffect(() => {
    if (!prevTasksComplete && running) {
      onUpdate({ timerEndAt: undefined, timerPausedRemaining: remaining });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevTasksComplete]);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (block.checked) return;
    if (!prevTasksComplete) {
      tapHaptic();
      toast("Complete previous tasks first", {
        description: "Finish the tasks above before starting this timer.",
      });
      return;
    }
    tapHaptic();
    if (running) {
      onUpdate({ timerEndAt: undefined, timerPausedRemaining: remaining });
    } else {
      const start = paused ? remaining : duration;
      onUpdate({ timerEndAt: Date.now() + start * 1000, timerPausedRemaining: undefined });
    }
  };

  const handleCheckboxClick = () => {
    if (!block.checked) {
      if (!prevTasksComplete) {
        tapHaptic();
        toast("Complete previous tasks first", {
          description: "Finish the tasks above before completing this timer.",
        });
        return;
      }
      successHaptic();
      onUpdate({ checked: true, timerEndAt: undefined, timerPausedRemaining: undefined });
    } else {
      tapHaptic();
      onUpdate({ checked: false, timerEndAt: undefined, timerPausedRemaining: undefined });
    }
  };

  const progress = duration > 0 ? 1 - remaining / duration : 0;
  const locked = !prevTasksComplete && !block.checked;
  const showProgress = running || paused;
  const displaySeconds = showProgress ? remaining : duration;

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3 shadow-block transition-colors",
          block.checked ? "border-success/30 bg-success-soft/30" : "border-border",
          locked && "opacity-70",
          running && "border-accent/40",
        )}
      >
        {/* Progress fill background */}
        {showProgress && !block.checked && (
          <div
            className="absolute inset-y-0 left-0 bg-accent/10 pointer-events-none transition-[width] duration-500 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        )}

        <div className="relative shrink-0">
          <RoutineCheckbox checked={!!block.checked} onChange={handleCheckboxClick} size={22} />
        </div>

        <div className="relative flex-1 min-w-0">
          {variant === "editor" ? (
            <input
              readOnly={!editable}
              value={block.text ?? ""}
              onChange={(e) => onUpdate({ text: e.target.value })}
              placeholder="Timer task"
              className={cn(
                "w-full bg-transparent border-0 outline-none text-[15px] font-semibold leading-snug",
                block.checked && "line-through text-muted-foreground",
              )}
            />
          ) : (
            <p
              className={cn(
                "text-[15px] font-medium leading-snug truncate",
                block.checked && "line-through text-muted-foreground",
              )}
            >
              {block.text || "Timer"}
            </p>
          )}
          <div className="mt-0.5 flex items-center gap-2">
            <button
              type="button"
              disabled={variant !== "editor" || running || paused || block.checked || !editable}
              onClick={(e) => {
                e.stopPropagation();
                if (variant === "editor" && editable && !running && !paused && !block.checked) {
                  setPickerOpen(true);
                }
              }}
              className={cn(
                "flex items-center gap-1 text-[13px] tabular-nums font-bold transition-colors",
                running ? "text-accent" : "text-muted-foreground",
                variant === "editor" && editable && !running && !paused && !block.checked && "hover:text-foreground cursor-pointer",
              )}
            >
              <TimerIcon size={13} strokeWidth={2.5} />
              {formatTime(displaySeconds)}
            </button>
            {locked && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                <Lock size={10} /> Locked
              </span>
            )}
          </div>
        </div>

        {!block.checked && (
          <button
            type="button"
            onClick={handlePlayPause}
            disabled={locked}
            className={cn(
              "relative h-10 w-10 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0",
              locked
                ? "bg-muted text-muted-foreground/50 cursor-not-allowed"
                : running
                ? "bg-accent/15 text-accent border border-accent/30"
                : "bg-accent text-accent-foreground shadow-md",
            )}
            aria-label={running ? "Pause" : "Start"}
          >
            {running ? <Pause size={16} strokeWidth={2.5} /> : <Play size={16} strokeWidth={2.5} className="ml-0.5" />}
          </button>
        )}
      </div>

      {variant === "editor" && (
        <DurationPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          valueSeconds={duration}
          onConfirm={(seconds) => onUpdate({ durationSeconds: seconds })}
        />
      )}
    </>
  );
};
