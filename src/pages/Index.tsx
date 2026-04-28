import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRoutines } from "@/hooks/useRoutines";
import { ProgressHeader } from "@/components/routine/ProgressHeader";
import { SectionBlock } from "@/components/routine/SectionBlock";

const Index = () => {
  const r = useRoutines();
  const navigate = useNavigate();

  const sortedSections = [...r.state.sections].sort((a, b) => a.order - b.order);

  const newRoutine = (sectionId?: string) => {
    navigate(sectionId ? `/routine/new?section=${sectionId}` : "/routine/new");
  };

  return (
    <div className="min-h-full bg-background pb-32">
      <ProgressHeader
        completed={r.completed}
        total={r.total}
        onOpenHistory={() => navigate("/history")}
      />

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
                onAdd={newRoutine}
                onDeleteSection={r.deleteSection}
                onToggleRoutine={r.toggleRoutine}
                onDeleteRoutine={r.deleteRoutine}
              />
            </motion.div>
          ))}
        </AnimatePresence>


        {r.total > 0 && (
          <p className="text-center text-xs text-muted-foreground pt-4">
            Tap a routine to edit · Long-press to delete · Resets at midnight
          </p>
        )}
      </main>

      {/* Floating Action: History + New */}
      <div
        className="fixed right-5 bottom-6 z-40 flex items-center gap-3"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate("/history")}
          className="flex items-center justify-center rounded-full bg-card border border-border text-foreground h-12 w-12 shadow-elevated"
          aria-label="History"
        >
          <CalendarDays size={18} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => newRoutine()}
          className="flex items-center gap-2 rounded-full bg-foreground text-background pl-4 pr-5 py-3.5 shadow-elevated transition-smooth hover:opacity-90"
          aria-label="Add routine"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span className="text-sm font-semibold">New routine</span>
        </motion.button>
      </div>

      
    </div>
  );
};

export default Index;
