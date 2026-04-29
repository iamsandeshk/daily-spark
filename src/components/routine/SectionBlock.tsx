import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, GripVertical, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import type { Routine } from "@/lib/routine-types";
import { RoutineCheckbox } from "./RoutineCheckbox";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { successHaptic, tapHaptic } from "@/lib/haptics";
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
            transition={{ duration: 0.18 }}
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
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className={cn("space-y-1.5 pb-1")}>
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
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
