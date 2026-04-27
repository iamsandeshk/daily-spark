import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FolderPlus, Plus } from "lucide-react";
import { useRoutines } from "@/hooks/useRoutines";
import { ProgressHeader } from "@/components/routine/ProgressHeader";
import { SectionBlock } from "@/components/routine/SectionBlock";
import { AddRoutineDialog } from "@/components/routine/AddRoutineDialog";
import { AddSectionDialog } from "@/components/routine/AddSectionDialog";

const Index = () => {
  const r = useRoutines();
  const [routineDialog, setRoutineDialog] = useState<{ open: boolean; sectionId?: string }>({ open: false });
  const [sectionDialog, setSectionDialog] = useState(false);

  const sortedSections = [...r.state.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-full bg-background pb-32">
      <ProgressHeader completed={r.completed} total={r.total} />

      <main className="px-4 space-y-6">
        <AnimatePresence initial={false}>
          {sortedSections.map((s) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <SectionBlock
                section={s}
                routines={r.state.routines.filter((x) => x.sectionId === s.id)}
                onToggleCollapsed={r.toggleSectionCollapsed}
                onAdd={(sectionId) => setRoutineDialog({ open: true, sectionId })}
                onDeleteSection={r.deleteSection}
                onToggleRoutine={r.toggleRoutine}
                onDeleteRoutine={r.deleteRoutine}
                onMoveRoutine={r.reorderRoutine}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={() => setSectionDialog(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3.5 py-3 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-smooth"
        >
          <FolderPlus size={15} /> New section
        </button>

        {r.total > 0 && (
          <p className="text-center text-xs text-muted-foreground pt-4">
            All routines reset at midnight, every day.
          </p>
        )}
      </main>

      {/* Floating Action Button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setRoutineDialog({ open: true })}
        className="fixed right-5 bottom-6 z-40 flex items-center gap-2 rounded-full bg-foreground text-background pl-4 pr-5 py-3.5 shadow-elevated transition-smooth hover:opacity-90"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Add routine"
      >
        <Plus size={18} strokeWidth={2.5} />
        <span className="text-sm font-semibold">New routine</span>
      </motion.button>

      <AddRoutineDialog
        open={routineDialog.open}
        onOpenChange={(v) => setRoutineDialog({ open: v, sectionId: v ? routineDialog.sectionId : undefined })}
        sections={sortedSections}
        defaultSectionId={routineDialog.sectionId}
        onCreate={r.addRoutine}
      />
      <AddSectionDialog open={sectionDialog} onOpenChange={setSectionDialog} onCreate={r.addSection} />
    </div>
  );
};

export default Index;
