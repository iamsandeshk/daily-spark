import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heading1,
  Heading2,
  Type,
  List,
  CheckSquare,
  Minus,
  Quote,
  Link as LinkIcon,
  Layers,
  Timer as TimerIcon,
  GripVertical,
  RotateCcw,
} from "lucide-react";
import { useToolbar, BLOCK_LABELS, DEFAULT_TOOLBAR, type ToolbarItem } from "@/lib/toolbar-config";
import type { BlockType } from "@/lib/routine-types";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tapHaptic, successHaptic } from "@/lib/haptics";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ICONS: Record<BlockType, typeof Type> = {
  text: Type,
  heading: Heading1,
  subheading: Heading2,
  checkbox: CheckSquare,
  timer: TimerIcon,
  bullet: List,
  routine: Layers,
  link: LinkIcon,
  divider: Minus,
  quote: Quote,
};

interface RowProps {
  item: ToolbarItem;
  isLast: boolean;
  onToggle: (v: boolean) => void;
}

const SortableRow = ({ item, isLast, onToggle }: RowProps) => {
  const Icon = ICONS[item.type];
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.type });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-3 py-2.5 bg-card",
        !isLast && "border-b border-border",
        isDragging && "shadow-lg opacity-90"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="h-9 w-7 grid place-items-center rounded-md text-muted-foreground hover:bg-muted touch-none cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </button>
      <div className="h-9 w-9 shrink-0 rounded-xl bg-muted flex items-center justify-center">
        <Icon size={16} strokeWidth={2.5} className="text-muted-foreground/80" />
      </div>
      <div className="flex-1 min-w-0 text-[15px] font-medium">
        {BLOCK_LABELS[item.type]}
      </div>
      <Switch
        checked={item.enabled}
        onCheckedChange={onToggle}
        aria-label={`Enable ${BLOCK_LABELS[item.type]}`}
      />
    </div>
  );
};

const ToolbarCustomization = () => {
  const navigate = useNavigate();
  const { items, setItems } = useToolbar();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.type === active.id);
    const newIndex = items.findIndex((i) => i.type === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setItems(arrayMove(items, oldIndex, newIndex));
    tapHaptic();
  };

  const toggle = (idx: number, v: boolean) => {
    const next = items.map((it, i) => (i === idx ? { ...it, enabled: v } : it));
    setItems(next);
    tapHaptic();
  };

  const reset = () => {
    setItems(DEFAULT_TOOLBAR);
    successHaptic();
  };

  return (
    <div className="min-h-full bg-background pb-20">
      <header className="safe-top px-5 pb-3 pt-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-serif font-bold">Toolbar</h1>
          <p className="text-xs text-muted-foreground">
            Drag to reorder. Toggle to show or hide in Quick Add.
          </p>
        </div>
      </header>

      <main className="px-5">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.type)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((it, i) => (
                <SortableRow
                  key={it.type}
                  item={it}
                  isLast={i === items.length - 1}
                  onToggle={(v) => toggle(i, v)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="mt-5 flex justify-between items-center gap-3">
          <Button
            variant="outline"
            onClick={reset}
            className="rounded-2xl h-11 font-semibold border-border/60"
          >
            <RotateCcw size={14} className="mr-1.5" /> Reset to defaults
          </Button>
          <Button
            onClick={() => {
              successHaptic();
              navigate(-1);
            }}
            className="rounded-2xl h-11 px-6 font-bold"
          >
            Done
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ToolbarCustomization;
