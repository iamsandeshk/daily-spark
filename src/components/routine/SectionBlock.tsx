import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import type { Routine, Section } from "@/lib/routine-types";
import { RoutineBlock } from "./RoutineBlock";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  section: Section;
  routines: Routine[];
  onToggleCollapsed: (id: string) => void;
  onAdd: (sectionId: string) => void;
  onDeleteSection: (id: string) => void;
  onToggleRoutine: (id: string) => void;
  onDeleteRoutine: (id: string) => void;
};

export const SectionBlock = ({
  section,
  routines,
  onToggleCollapsed,
  onAdd,
  onDeleteSection,
  onToggleRoutine,
  onDeleteRoutine,
}: Props) => {
  const sorted = [...routines].sort((a, b) => a.order - b.order);
  const done = sorted.filter((r) => r.isCompleted).length;

  return (
    <section className="space-y-2">
      <header className="flex items-center gap-2 px-1 group">
        <button
          onClick={() => onToggleCollapsed(section.id)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <motion.span
            animate={{ rotate: section.collapsed ? -90 : 0 }}
            transition={{ duration: 0.18 }}
            className="text-muted-foreground"
          >
            <ChevronDown size={16} />
          </motion.span>
          {section.emoji && <span className="text-lg leading-none">{section.emoji}</span>}
          <h2 className="text-base font-semibold tracking-tight truncate">{section.title}</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {done}/{sorted.length}
          </span>
        </button>
        <button
          onClick={() => onAdd(section.id)}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-smooth"
          aria-label="Add routine"
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
              onSelect={() => onDeleteSection(section.id)}
            >
              <Trash2 size={14} className="mr-2" /> Delete section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <AnimatePresence initial={false}>
        {!section.collapsed && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className={cn("space-y-1.5 pb-1")}>
              {sorted.length === 0 && (
                <button
                  onClick={() => onAdd(section.id)}
                  className="w-full text-left text-sm text-muted-foreground rounded-xl border border-dashed border-border px-3.5 py-3 hover:bg-muted/50 transition-smooth"
                >
                  + Add a routine
                </button>
              )}
              {sorted.map((r) => (
                <RoutineBlock
                  key={r.id}
                  routine={r}
                  onToggle={onToggleRoutine}
                  onDelete={onDeleteRoutine}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
