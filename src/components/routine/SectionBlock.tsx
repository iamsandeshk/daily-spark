import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, GripVertical, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import type { Routine } from "@/lib/routine-types";

// Shared animation config — used by all section open/close transitions
// and routine card stagger so timing/easing stay perfectly in sync.
const SECTION_EASE = [0.22, 1, 0.36, 1] as const;
const SECTION_DURATION = 0.4;
const CARD_DURATION = 0.28;
const STAGGER = 0.04;
const STAGGER_DELAY = 0.04;
import { RoutineCheckbox } from "./RoutineCheckbox";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { completionHaptic, successHaptic, tapHaptic } from "@/lib/haptics";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  routine: Routine;
  onToggleCollapsed: (id: string) => void;
  onAdd: (id: string) => void;
  onDeleteSection: (id: string) => void;
  onToggleReorder: () => void;
  setRoutineBlocks: (id: string, blocks: Routine["blocks"]) => void;
};

export const SectionBlock = ({
  routine,
  onToggleCollapsed,
  onAdd,
  onDeleteSection,
  onToggleReorder,
  setRoutineBlocks,
}: Props) => {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const blocks = (routine.blocks ?? []).filter((b) => b.type === "checkbox" && b.text?.trim());
  const done = blocks.filter((b) => b.checked).length;

  const handleToggleCheckbox = (blockId: string) => {
    const updatedBlocks = (routine.blocks ?? []).map((b) => {
      if (b.id === blockId) {
        if (!b.checked) successHaptic();
        else tapHaptic();
        return { ...b, checked: !b.checked };
      }
      return b;
    });
    // Detect "just completed everything" transition → stronger haptic
    const checks = updatedBlocks.filter((b) => b.type === "checkbox" && b.text?.trim());
    const wasAllDone = blocks.length > 0 && blocks.every((b) => b.checked);
    const isAllDone = checks.length > 0 && checks.every((b) => b.checked);
    if (!wasAllDone && isAllDone) completionHaptic();
    setRoutineBlocks(routine.id, updatedBlocks);
  };

  return (
    <section className="space-y-2">
      <header className="flex items-center gap-2 px-1 group">
        <button
          onClick={() => onToggleCollapsed(routine.id)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <motion.span
            animate={{ rotate: routine.collapsed ? -90 : 0 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="text-muted-foreground"
          >
            <ChevronDown size={16} />
          </motion.span>
          {routine.emoji && <span className="text-lg leading-none">{routine.emoji}</span>}
          <h2 className="text-base font-semibold tracking-tight truncate">{routine.title}</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {done}/{blocks.length}
          </span>
        </button>
        <button
          onClick={() => onAdd(routine.id)}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-smooth"
          aria-label="Edit routine"
        >
          <Plus size={16} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-smooth"
              aria-label="Section options"
            >
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setDeleteOpen(true)}
            >
              <Trash2 size={14} className="mr-2" /> Delete section
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onToggleReorder}>
              <GripVertical size={14} className="mr-2" /> Reorder sections
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete section?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{routine.title}" and all routines inside it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDeleteSection(routine.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <motion.div
              className={cn("space-y-1.5 pb-1 pt-0.5")}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: STAGGER,
                    delayChildren: STAGGER_DELAY,
                  },
                },
                hidden: {
                  transition: {
                    staggerChildren: STAGGER,
                    staggerDirection: -1,
                  },
                },
              }}
            >
              {blocks.length === 0 && (
                <button
                  onClick={() => onAdd(routine.id)}
                  className="w-full text-left text-sm text-muted-foreground rounded-xl border border-dashed border-border px-3.5 py-3 hover:bg-muted/50 transition-smooth"
                >
                  + Add tasks inside this section
                </button>
              )}
              {blocks.map((b) => (
                <motion.div
                  key={b.id}
                  variants={{
                    hidden: { opacity: 0, scale: 0.98 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                  transition={{ duration: CARD_DURATION, ease: SECTION_EASE }}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 shadow-block transition-colors",
                    b.checked && "bg-success-soft/40 border-success/20",
                  )}
                >
                  <div className="shrink-0">
                    <RoutineCheckbox
                      checked={!!b.checked}
                      onChange={() => handleToggleCheckbox(b.id)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/routine/${routine.id}`)}
                    className="flex-1 min-w-0 text-left select-none"
                  >
                    <span
                      className={cn(
                        "font-medium text-[15px] leading-snug truncate transition-colors",
                        b.checked && "line-through text-muted-foreground",
                      )}
                    >
                      {b.text || "Untitled Task"}
                    </span>
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
