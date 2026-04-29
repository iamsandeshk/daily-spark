import { Reorder, useDragControls } from "framer-motion";
import { CalendarDays, GripVertical, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoutines } from "@/hooks/useRoutines";
import { ProgressHeader } from "@/components/routine/ProgressHeader";
import { SectionBlock } from "@/components/routine/SectionBlock";
import type { Section } from "@/lib/routine-types";

const Index = () => {
  const r = useRoutines();
  const navigate = useNavigate();
  const [reorderMode, setReorderMode] = useState(false);

  const sortedSections = [...r.state.sections].sort((a, b) => a.order - b.order);
  // Local mirror so dragging feels instantaneous; sync when source changes.
  const [order, setOrder] = useState<Section[]>(sortedSections);
  useEffect(() => {
    setOrder(sortedSections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.state.sections]);

  const newRoutine = (sectionId?: string) => {
    if (sectionId) {
      // If the section already has a routine, open it so the user can add more
      // checkboxes inside (per the "title = section" model). Otherwise create new.
      const existing = r.state.routines
        .filter((x) => x.sectionId === sectionId)
        .sort((a, b) => a.order - b.order)[0];
      if (existing) {
        navigate(`/routine/${existing.id}`);
        return;
      }
      navigate(`/routine/new?section=${sectionId}`);
      return;
    }
    navigate("/routine/new");
  };

  const handleReorder = (next: Section[]) => {
    setOrder(next);
    r.reorderSections(next.map((s) => s.id));
  };

  return (
    <div className="min-h-full bg-background pb-32">
      <ProgressHeader
        completed={r.completed}
        total={r.total}
        onOpenHistory={() => navigate("/history")}
        reorderActive={reorderMode}
        onToggleReorder={() => setReorderMode((v) => !v)}
      />

      <main className="px-4">
        <Reorder.Group axis="y" values={order} onReorder={handleReorder} className="space-y-6">
          {order.map((s) => (
            <SectionReorderItem
              key={s.id}
              section={s}
              reorderMode={reorderMode}
              routines={r.state.routines.filter((x) => x.sectionId === s.id)}
              onToggleCollapsed={r.toggleSectionCollapsed}
              onAdd={newRoutine}
              onDeleteSection={r.deleteSection}
              onToggleRoutine={r.toggleRoutine}
              onDeleteRoutine={r.deleteRoutine}
            />
          ))}
        </Reorder.Group>

        {r.total > 0 && (
          <p className="text-center text-xs text-muted-foreground pt-6">
            Tap a routine to edit · Long-press to delete · Resets at midnight
          </p>
        )}
      </main>

      {/* Floating Action: History + New */}
      <div
        className="fixed right-5 bottom-6 z-40 flex items-center gap-3"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <button
          onClick={() => navigate("/history")}
          className="flex items-center justify-center rounded-full bg-card border border-border text-foreground h-12 w-12 shadow-elevated active:scale-95 transition-transform"
          aria-label="History"
        >
          <CalendarDays size={18} />
        </button>
        <button
          onClick={() => newRoutine()}
          className="flex items-center gap-2 rounded-full bg-foreground text-background pl-4 pr-5 py-3.5 shadow-elevated transition-smooth hover:opacity-90 active:scale-95"
          aria-label="Add routine"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span className="text-sm font-semibold">New routine</span>
        </button>
      </div>
    </div>
  );
};

type ItemProps = {
  section: Section;
  reorderMode: boolean;
  routines: ReturnType<typeof useRoutines>["state"]["routines"];
  onToggleCollapsed: (id: string) => void;
  onAdd: (sectionId: string) => void;
  onDeleteSection: (id: string) => void;
  onToggleRoutine: (id: string) => void;
  onDeleteRoutine: (id: string) => void;
};

const SectionReorderItem = ({ section, reorderMode, ...rest }: ItemProps) => {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={section}
      dragListener={false}
      dragControls={controls}
      className="relative"
    >
      {reorderMode && (
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          className="absolute -left-1 top-1.5 z-10 p-1 text-muted-foreground/60 hover:text-foreground touch-none cursor-grab active:cursor-grabbing"
          aria-label={`Drag ${section.title}`}
        >
          <GripVertical size={14} />
        </button>
      )}
      <div className={reorderMode ? "pl-5" : "pl-0"}>
        <SectionBlock section={section} {...rest} />
      </div>
    </Reorder.Item>
  );
};

export default Index;
