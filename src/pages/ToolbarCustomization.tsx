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
  ChevronUp,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { useToolbar, BLOCK_LABELS, DEFAULT_TOOLBAR } from "@/lib/toolbar-config";
import type { BlockType } from "@/lib/routine-types";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tapHaptic, successHaptic } from "@/lib/haptics";

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

const ToolbarCustomization = () => {
  const navigate = useNavigate();
  const { items, setItems } = useToolbar();

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[idx], next[j]] = [next[j], next[idx]];
    setItems(next);
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
            Choose which block types appear in Quick Add and their order
          </p>
        </div>
      </header>

      <main className="px-5">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {items.map((it, i) => {
            const Icon = ICONS[it.type];
            return (
              <div
                key={it.type}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5",
                  i < items.length - 1 && "border-b border-border"
                )}
              >
                <div className="flex flex-col">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="h-6 w-6 grid place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    aria-label="Move down"
                    className="h-6 w-6 grid place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="h-9 w-9 shrink-0 rounded-xl bg-muted flex items-center justify-center">
                  <Icon size={16} strokeWidth={2.5} className="text-muted-foreground/80" />
                </div>
                <div className="flex-1 min-w-0 text-[15px] font-medium">
                  {BLOCK_LABELS[it.type]}
                </div>
                <Switch
                  checked={it.enabled}
                  onCheckedChange={(v) => toggle(i, v)}
                  aria-label={`Enable ${BLOCK_LABELS[it.type]}`}
                />
              </div>
            );
          })}
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
