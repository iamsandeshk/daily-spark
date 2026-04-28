import { useRef } from "react";
import {
  Heading1,
  Heading2,
  Type,
  List,
  CheckSquare,
  Minus,
  Quote,
  Link as LinkIcon,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import type { BlockType, RoutineBlockContent } from "@/lib/routine-types";
import { cn } from "@/lib/utils";

const uid = () => Math.random().toString(36).slice(2, 10);

const blockMenu: { type: BlockType; label: string; icon: typeof Type }[] = [
  { type: "text", label: "Text", icon: Type },
  { type: "heading", label: "Heading", icon: Heading1 },
  { type: "subheading", label: "Subheading", icon: Heading2 },
  { type: "checkbox", label: "To-do", icon: CheckSquare },
  { type: "bullet", label: "Bullet list", icon: List },
  { type: "quote", label: "Note / Quote", icon: Quote },
  { type: "link", label: "Link", icon: LinkIcon },
  { type: "divider", label: "Divider", icon: Minus },
];

type Props = {
  blocks: RoutineBlockContent[];
  onChange: (next: RoutineBlockContent[]) => void;
};

export const BlockEditor = ({ blocks, onChange }: Props) => {
  const addBlock = (type: BlockType, afterIndex?: number) => {
    const nb: RoutineBlockContent = { id: uid(), type, text: "", checked: type === "checkbox" ? false : undefined };
    const next = [...blocks];
    const at = afterIndex === undefined ? next.length : afterIndex + 1;
    next.splice(at, 0, nb);
    onChange(next);
  };

  const updateBlock = (id: string, patch: Partial<RoutineBlockContent>) => {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const removeBlock = (id: string) => onChange(blocks.filter((b) => b.id !== id));

  const moveBlock = (index: number, dir: -1 | 1) => {
    const next = [...blocks];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-1">
      {blocks.map((b, i) => (
        <BlockRow
          key={b.id}
          block={b}
          index={i}
          onUpdate={(patch) => updateBlock(b.id, patch)}
          onRemove={() => removeBlock(b.id)}
          onMoveUp={() => moveBlock(i, -1)}
          onMoveDown={() => moveBlock(i, 1)}
          onAddAfter={(type) => addBlock(type, i)}
        />
      ))}

      {/* Add-block toolbar */}
      <div className="pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">
          Add block
        </p>
        <div className="flex flex-wrap gap-1.5">
          {blockMenu.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.type}
                type="button"
                onClick={() => addBlock(m.type)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-smooth"
              >
                <Icon size={13} strokeWidth={2.25} />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

type RowProps = {
  block: RoutineBlockContent;
  index: number;
  onUpdate: (patch: Partial<RoutineBlockContent>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddAfter: (type: BlockType) => void;
};

const BlockRow = ({ block, onUpdate, onRemove, onMoveUp, onMoveDown, onAddAfter }: RowProps) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const autoGrow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "0px";
    el.style.height = el.scrollHeight + "px";
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Continue same block type on Enter for list-like blocks
      const continueTypes: BlockType[] = ["bullet", "checkbox", "text"];
      onAddAfter(continueTypes.includes(block.type) ? block.type : "text");
    }
    if (e.key === "Backspace" && !block.text) {
      e.preventDefault();
      onRemove();
    }
  };

  return (
    <div className="group relative flex items-start gap-1.5 rounded-md -mx-1 px-1 py-0.5 hover:bg-muted/40 transition-colors">
      {/* Gutter controls */}
      <div className="flex flex-col items-center gap-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onMoveUp}
          className="h-5 w-5 rounded text-muted-foreground hover:bg-muted text-[10px]"
          aria-label="Move up"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          className="h-5 w-5 rounded text-muted-foreground hover:bg-muted text-[10px]"
          aria-label="Move down"
        >
          ↓
        </button>
      </div>

      <div className="flex-1 min-w-0">
        {block.type === "divider" ? (
          <div className="py-3">
            <div className="h-px w-full bg-border" />
          </div>
        ) : block.type === "checkbox" ? (
          <div className="flex items-start gap-2 py-1">
            <input
              type="checkbox"
              checked={!!block.checked}
              onChange={(e) => onUpdate({ checked: e.target.checked })}
              className="mt-1.5 h-4 w-4 accent-[hsl(var(--success))] shrink-0"
            />
            <textarea
              ref={inputRef}
              rows={1}
              value={block.text ?? ""}
              onChange={(e) => {
                onUpdate({ text: e.target.value });
                autoGrow(e.target);
              }}
              onInput={(e) => autoGrow(e.currentTarget)}
              onKeyDown={handleKey}
              placeholder="To-do"
              className={cn(
                "flex-1 bg-transparent border-0 outline-none resize-none text-[15px] leading-snug",
                block.checked && "line-through text-muted-foreground",
              )}
            />
          </div>
        ) : block.type === "bullet" ? (
          <div className="flex items-start gap-2 py-1">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" />
            <textarea
              rows={1}
              value={block.text ?? ""}
              onChange={(e) => {
                onUpdate({ text: e.target.value });
                autoGrow(e.target);
              }}
              onInput={(e) => autoGrow(e.currentTarget)}
              onKeyDown={handleKey}
              placeholder="List item"
              className="flex-1 bg-transparent border-0 outline-none resize-none text-[15px] leading-snug"
            />
          </div>
        ) : block.type === "heading" ? (
          <textarea
            rows={1}
            value={block.text ?? ""}
            onChange={(e) => {
              onUpdate({ text: e.target.value });
              autoGrow(e.target);
            }}
            onInput={(e) => autoGrow(e.currentTarget)}
            onKeyDown={handleKey}
            placeholder="Heading"
            className="w-full bg-transparent border-0 outline-none resize-none text-2xl font-semibold tracking-tight py-1"
          />
        ) : block.type === "subheading" ? (
          <textarea
            rows={1}
            value={block.text ?? ""}
            onChange={(e) => {
              onUpdate({ text: e.target.value });
              autoGrow(e.target);
            }}
            onInput={(e) => autoGrow(e.currentTarget)}
            onKeyDown={handleKey}
            placeholder="Subheading"
            className="w-full bg-transparent border-0 outline-none resize-none text-lg font-semibold py-1"
          />
        ) : block.type === "quote" ? (
          <div className="border-l-2 border-accent pl-3 py-1">
            <textarea
              rows={1}
              value={block.text ?? ""}
              onChange={(e) => {
                onUpdate({ text: e.target.value });
                autoGrow(e.target);
              }}
              onInput={(e) => autoGrow(e.currentTarget)}
              onKeyDown={handleKey}
              placeholder="Note or quote"
              className="w-full bg-transparent border-0 outline-none resize-none text-[15px] leading-snug italic text-muted-foreground"
            />
          </div>
        ) : block.type === "link" ? (
          <div className="space-y-1 py-1">
            <input
              value={block.text ?? ""}
              onChange={(e) => onUpdate({ text: e.target.value })}
              placeholder="Link label"
              className="w-full bg-transparent border-0 outline-none text-[15px] font-medium"
            />
            <input
              value={block.url ?? ""}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="https://…"
              className="w-full bg-transparent border-0 outline-none text-[13px] text-accent underline underline-offset-2"
            />
          </div>
        ) : (
          <textarea
            rows={1}
            value={block.text ?? ""}
            onChange={(e) => {
              onUpdate({ text: e.target.value });
              autoGrow(e.target);
            }}
            onInput={(e) => autoGrow(e.currentTarget)}
            onKeyDown={handleKey}
            placeholder="Type something, press Enter for a new block…"
            className="w-full bg-transparent border-0 outline-none resize-none text-[15px] leading-snug py-1"
          />
        )}
      </div>

      <div className="flex items-center gap-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onRemove}
          className="h-6 w-6 grid place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          aria-label="Delete block"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

/** Read-only block renderer (used on the list/detail preview if needed). */
export const BlockPreview = ({ blocks }: { blocks: RoutineBlockContent[] }) => {
  return (
    <div className="space-y-1.5">
      {blocks.map((b) => {
        if (b.type === "divider") return <div key={b.id} className="h-px w-full bg-border my-2" />;
        if (b.type === "heading") return <h3 key={b.id} className="text-xl font-semibold">{b.text}</h3>;
        if (b.type === "subheading") return <h4 key={b.id} className="text-base font-semibold">{b.text}</h4>;
        if (b.type === "bullet")
          return (
            <div key={b.id} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground shrink-0" />
              <p className="text-sm">{b.text}</p>
            </div>
          );
        if (b.type === "checkbox")
          return (
            <div key={b.id} className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-0.5 h-4 w-4 rounded-sm border flex items-center justify-center text-[10px]",
                  b.checked ? "bg-success border-success text-success-foreground" : "border-input",
                )}
              >
                {b.checked && "✓"}
              </span>
              <p className={cn("text-sm", b.checked && "line-through text-muted-foreground")}>{b.text}</p>
            </div>
          );
        if (b.type === "quote")
          return (
            <p key={b.id} className="border-l-2 border-accent pl-3 italic text-muted-foreground text-sm">
              {b.text}
            </p>
          );
        if (b.type === "link")
          return (
            <a
              key={b.id}
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-accent underline underline-offset-2"
            >
              {b.text || b.url}
            </a>
          );
        return <p key={b.id} className="text-sm leading-relaxed">{b.text}</p>;
      })}
    </div>
  );
};

// Re-export unused icons to quiet linter
export type { BlockType };
void [Plus, GripVertical];
