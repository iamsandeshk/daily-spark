import { AnimatePresence, motion } from "framer-motion";
import { Archive, ChevronDown, Flame, GripVertical, MoreHorizontal, Plus, Trash2, Edit3 } from "lucide-react";
import type { Routine } from "@/lib/routine-types";
import { RoutineCheckbox } from "./RoutineCheckbox";
import { TimerRow } from "./TimerRow";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { completionHaptic, successHaptic, tapHaptic } from "@/lib/haptics";
import { useEffect, useState } from "react";
import { getRoutineColor } from "@/lib/routine-colors";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uid } from "@/lib/utils";

const SECTION_EASE = [0.32, 0.72, 0, 1] as const;
const SECTION_DURATION = 0.35;

type Props = {
  routine: Routine;
  onToggleCollapsed: (id: string) => void;
  onAdd: (id: string) => void;
  onDeleteSection: (id: string) => void;
  onToggleReorder: () => void;
  onArchive: (id: string) => void;
  setRoutineBlocks: (id: string, blocks: Routine["blocks"]) => void;
};

export const SectionBlock = ({
  routine,
  onToggleCollapsed,
  onAdd,
  onDeleteSection,
  onToggleReorder,
  onArchive,
  setRoutineBlocks,
}: Props) => {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [recentlyCheckedIds, setRecentlyCheckedIds] = useState<Set<string>>(new Set());

  const color = getRoutineColor(routine);
  const allBlocks = (routine.blocks ?? []).filter(
    (b) => (b.type === "checkbox" || b.type === "timer") && b.text?.trim(),
  );
  const done = allBlocks.filter((b) => b.checked).length;
  const pct = allBlocks.length > 0 ? Math.round((done / allBlocks.length) * 100) : 0;

  // Show all tasks in their authored sequence; checked tasks float to the bottom after short delay
  const indexById = new Map(allBlocks.map((b, i) => [b.id, i] as const));
  const sorted = [...allBlocks].sort((a, b) => {
    const aIsDone = a.checked && !recentlyCheckedIds.has(a.id);
    const bIsDone = b.checked && !recentlyCheckedIds.has(b.id);
    if (aIsDone !== bIsDone) return aIsDone ? 1 : -1;
    return (indexById.get(a.id) ?? 0) - (indexById.get(b.id) ?? 0);
  });
  const visibleBlocks = sorted.slice(0, 5);
  const remainingCount = allBlocks.length - visibleBlocks.length;

  const prevDoneById = new Map<string, boolean>();
  let runningAllDone = true;
  for (const b of allBlocks) {
    prevDoneById.set(b.id, runningAllDone);
    if (!b.checked) runningAllDone = false;
  }

  const updateBlock = (blockId: string, patch: Partial<(typeof allBlocks)[number]>) => {
    const next = (routine.blocks ?? []).map((b) => (b.id === blockId ? { ...b, ...patch } : b));
    setRoutineBlocks(routine.id, next);
  };

  // Auto-start idle timers once preceding tasks are completed
  useEffect(() => {
    const blocks = routine.blocks ?? [];
    let changed = false;
    let prevAllDone = true;
    const nextBlocks = blocks.map((b) => {
      const isTask = (b.type === "checkbox" || b.type === "timer") && !!b.text?.trim();
      const wasPrevDone = prevAllDone;
      if (isTask && !b.checked) prevAllDone = false;
      if (b.type !== "timer" || !b.text?.trim()) return b;
      const idle = !b.checked && !b.timerEndAt && b.timerPausedRemaining === undefined;
      if (wasPrevDone && idle) {
        changed = true;
        const dur = b.durationSeconds ?? 60;
        return { ...b, timerEndAt: Date.now() + dur * 1000 };
      }
      return b;
    });
    if (changed) setRoutineBlocks(routine.id, nextBlocks);
  }, [routine.blocks]);

  const handleToggleCheckbox = (blockId: string) => {
    const isChecking = !(routine.blocks ?? []).find((b) => b.id === blockId)?.checked;

    if (isChecking) {
      setRecentlyCheckedIds((prev) => new Set(prev).add(blockId));
      setTimeout(() => {
        setRecentlyCheckedIds((prev) => {
          const next = new Set(prev);
          next.delete(blockId);
          return next;
        });
      }, 700);
    }

    const updatedBlocks = (routine.blocks ?? []).map((b) => {
      if (b.id === blockId) {
        if (!b.checked) successHaptic();
        else tapHaptic();
        return { ...b, checked: !b.checked };
      }
      return b;
    });

    const checks = updatedBlocks.filter(
      (b) => (b.type === "checkbox" || b.type === "timer") && b.text?.trim(),
    );
    const wasAllDone = allBlocks.length > 0 && allBlocks.every((b) => b.checked);
    const isAllDone = checks.length > 0 && checks.every((b) => b.checked);
    if (!wasAllDone && isAllDone) completionHaptic();
    setRoutineBlocks(routine.id, updatedBlocks);
  };

  const handleQuickAdd = () => {
    const text = newTaskText.trim();
    if (!text) return;
    const newBlock = { id: uid(), type: "checkbox" as const, text, checked: false };
    setRoutineBlocks(routine.id, [...(routine.blocks ?? []), newBlock]);
    successHaptic();
    setNewTaskText("");
    setAddOpen(false);
  };

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-border transition-all duration-150 relative">
      {/* Routine Card Header */}
      <header className="flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => onToggleCollapsed(routine.id)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left select-none group"
        >
          {/* Refined icon container */}
          <div className="h-10 w-10 rounded-xl bg-secondary/80 border border-border/60 flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-102">
            <span>{routine.emoji || "✨"}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-foreground truncate">
                {routine.title}
              </h2>
              {routine.streakCount > 0 && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold border border-accent/20 shrink-0">
                  <Flame size={10} className="fill-accent/30" />
                  {routine.streakCount}
                </span>
              )}
            </div>

            {/* Task count and progress bar */}
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 w-16 bg-secondary rounded-full overflow-hidden shrink-0">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={false}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium tabular-nums">
                {done}/{allBlocks.length}
              </span>
            </div>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setAddOpen(true)}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Add task"
          >
            <Plus size={16} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                aria-label="Routine options"
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl min-w-[160px]">
              <DropdownMenuItem onSelect={() => navigate(`/routine/${routine.id}`)}>
                <Edit3 size={14} className="mr-2" /> Edit routine
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onArchive(routine.id)}>
                <Archive size={14} className="mr-2" /> Archive
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onToggleReorder}>
                <GripVertical size={14} className="mr-2" /> Reorder
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-500 dark:text-red-400 focus:text-red-600 dark:focus:text-red-300 font-medium"
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 size={14} className="mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => onToggleCollapsed(routine.id)}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label={routine.collapsed ? "Expand routine" : "Collapse routine"}
          >
            <motion.span
              animate={{ rotate: routine.collapsed ? -90 : 0 }}
              transition={{ duration: SECTION_DURATION, ease: SECTION_EASE }}
              className="inline-block"
            >
              <ChevronDown size={16} />
            </motion.span>
          </button>
        </div>
      </header>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl p-6 gap-5 max-w-[90vw] sm:max-w-md">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold">Delete routine?</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              This will permanently delete "{routine.title}" and its tasks. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2.5 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="flex-1 rounded-xl h-11 font-semibold"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDeleteSection(routine.id);
                setDeleteOpen(false);
              }}
              className="flex-1 rounded-xl h-11 font-semibold"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Task Dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) setNewTaskText("");
        }}
      >
        <DialogContent className="rounded-2xl p-6 gap-4 max-w-[90vw] sm:max-w-md">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <span>{routine.emoji || "✨"}</span>
              Add task to {routine.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Type your task name and press Enter.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleQuickAdd();
              }
            }}
            placeholder="e.g. Drink 500ml water"
            className="h-11 rounded-xl text-sm"
          />
          <DialogFooter className="flex flex-row gap-2.5 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              className="flex-1 rounded-xl h-11 font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleQuickAdd}
              disabled={!newTaskText.trim()}
              className="flex-1 rounded-xl h-11 font-semibold"
            >
              Add task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expandable Task List */}
      <AnimatePresence initial={false}>
        {!routine.collapsed && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: SECTION_DURATION, ease: SECTION_EASE },
              opacity: { duration: SECTION_DURATION, ease: SECTION_EASE },
            }}
            style={{ overflow: "hidden" }}
          >
            <div className="flex flex-col gap-2 pt-3.5 pb-0.5">
              {allBlocks.length === 0 && (
                <button
                  onClick={() => onAdd(routine.id)}
                  className="w-full text-center text-xs text-muted-foreground rounded-xl border border-dashed border-border/80 py-3 hover:bg-muted/40 transition-colors"
                >
                  + Add first task to this routine
                </button>
              )}

              <AnimatePresence initial={false} mode="popLayout">
                {visibleBlocks.map((b) => (
                  <motion.div
                    key={b.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {b.type === "timer" ? (
                      <TimerRow
                        block={b}
                        prevTasksComplete={prevDoneById.get(b.id) ?? true}
                        variant="home"
                        onUpdate={(patch) => updateBlock(b.id, patch)}
                        onDelete={() =>
                          setRoutineBlocks(
                            routine.id,
                            (routine.blocks ?? []).filter((x) => x.id !== b.id),
                          )
                        }
                      />
                    ) : (
                      <div
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/35 px-3.5 py-2.5 transition-all duration-150 hover:border-border",
                          b.checked && "bg-secondary/15 border-border/30 opacity-70",
                        )}
                      >
                        <RoutineCheckbox
                          checked={!!b.checked}
                          accentColor={color.hex}
                          onChange={() => handleToggleCheckbox(b.id)}
                        />

                        <button
                          type="button"
                          onClick={() => navigate(`/routine/${routine.id}`)}
                          className="flex-1 min-w-0 text-left select-none"
                        >
                          <span
                            className={cn(
                              "text-sm font-medium leading-snug truncate transition-all duration-150 block",
                              b.checked
                                ? "line-through text-muted-foreground/60"
                                : "text-foreground",
                            )}
                          >
                            {b.text || "Untitled Task"}
                          </span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {remainingCount > 0 && (
                <button
                  onClick={() => navigate(`/routine/${routine.id}`)}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium pt-1.5 pb-0.5 text-center transition-colors block w-full"
                >
                  + {remainingCount} more tasks
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
};
