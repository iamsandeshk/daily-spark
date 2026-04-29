import { useRef, useState } from "react";
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
  X,
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
  editable: boolean;
};

export const BlockEditor = ({ blocks, onChange, editable }: Props) => {
  const [toolboxOpen, setToolboxOpen] = useState(false);

  const addBlock = (type: BlockType, afterIndex?: number) => {
    const nb: RoutineBlockContent = { id: uid(), type, text: "", checked: type === "checkbox" ? false : undefined };
    const next = [...blocks];
    const at = afterIndex === undefined ? next.length : afterIndex + 1;
    next.splice(at, 0, nb);
    onChange(next);
    setToolboxOpen(false);
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
      {blocks.length === 0 && (
        <p className="text-sm text-muted-foreground/70 italic py-2">
          {editable ? "Empty page. Tap the toolbox below to add blocks." : "No content yet. Tap Edit to add some."}
        </p>
      )}

      {blocks.map((b, i) => (
        <BlockRow
          key={b.id}
          block={b}
          editable={editable}
          onUpdate={(patch) => updateBlock(b.id, patch)}
          onRemove={() => removeBlock(b.id)}
          onMoveUp={() => moveBlock(i, -1)}
          onMoveDown={() => moveBlock(i, 1)}
          onAddAfter={(type) => addBlock(type, i)}
        />
      ))}

      {/* Add-block toolbox — only in edit mode */}
      {editable && (
        <div className="pt-4">
          {!toolboxOpen ? (
            <button
              type="button"
              onClick={() => setToolboxOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-dashed border-border bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/40 hover:bg-muted transition-smooth"
            >
              <Plus size={14} strokeWidth={2.5} />
              Add block
            </button>
          ) : (
            <div className="rounded-xl border border-border bg-card/60 p-3 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Choose a block
                </p>
                <button
                  type="button"
                  onClick={() => setToolboxOpen(false)}
                  className="h-6 w-6 grid place-items-center rounded-md text-muted-foreground hover:bg-muted"
                  aria-label="Close toolbox"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {blockMenu.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.type}
                      type="button"
                      onClick={() => addBlock(m.type)}
                      className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted hover:border-foreground/20 transition-smooth"
                    >
                      <Icon size={15} strokeWidth={2.25} className="text-muted-foreground" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

type RowProps = {
  block: RoutineBlockContent;
  editable: boolean;
  onUpdate: (patch: Partial<RoutineBlockContent>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddAfter: (type: BlockType) => void;
};

const BlockRow = ({ block, editable, onUpdate, onRemove, onMoveUp, onMoveDown, onAddAfter }: RowProps) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const autoGrow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "0px";
    el.style.height = el.scrollHeight + "px";
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!editable) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const continueTypes: BlockType[] = ["bullet", "checkbox", "text"];
      onAddAfter(continueTypes.includes(block.type) ? block.type : "text");
    }
    if (e.key === "Backspace" && !block.text) {
      e.preventDefault();
      onRemove();
    }
  };

  const ro = !editable;

  return (
    <div
      className={cn(
        "group relative flex items-start gap-1.5 rounded-md -mx-1 px-1 py-0.5 transition-colors",
        editable && "hover:bg-muted/40",
      )}
    >
      {editable && (
        <div className="flex flex-col items-center gap-0.5 pt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
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
      )}

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
              readOnly={ro}
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
              readOnly={ro}
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
            readOnly={ro}
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
            readOnly={ro}
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
              readOnly={ro}
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
              readOnly={ro}
              value={block.text ?? ""}
              onChange={(e) => onUpdate({ text: e.target.value })}
              placeholder="Link label"
              className="w-full bg-transparent border-0 outline-none text-[15px] font-medium"
            />
            {ro && block.url ? (
              <a
                href={block.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[13px] text-accent underline underline-offset-2"
              >
                {block.url}
              </a>
            ) : (
              <input
                readOnly={ro}
                value={block.url ?? ""}
                onChange={(e) => onUpdate({ url: e.target.value })}
                placeholder="https://…"
                className="w-full bg-transparent border-0 outline-none text-[13px] text-accent underline underline-offset-2"
              />
            )}
          </div>
        ) : (
          <textarea
            rows={1}
            readOnly={ro}
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

      {editable && (
        <div className="flex items-center gap-0.5 pt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onRemove}
            className="h-6 w-6 grid place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="Delete block"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

/** Read-only block renderer */
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

export type { BlockType };
