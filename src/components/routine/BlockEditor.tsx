import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  X,
} from "lucide-react";
import type { BlockType, RoutineBlockContent } from "@/lib/routine-types";
import { cn } from "@/lib/utils";
import { completionHaptic, successHaptic, tapHaptic } from "@/lib/haptics";
import { RoutineCheckbox } from "./RoutineCheckbox";

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
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [focusedCursorPos, setFocusedCursorPos] = useState<number | null>(null);

  const addBlock = (type: BlockType, afterIndex?: number) => {
    const nb: RoutineBlockContent = { id: uid(), type, text: "", checked: type === "checkbox" ? false : undefined };
    const next = [...blocks];
    const at = afterIndex === undefined ? next.length : afterIndex + 1;
    next.splice(at, 0, nb);
    setFocusedBlockId(nb.id);
    setFocusedCursorPos(0);
    onChange(next);
    setToolboxOpen(false);
  };

  const handleEnter = (index: number) => {
    const block = blocks[index];
    const nextBlock = blocks[index + 1];
    if (nextBlock && nextBlock.type === block.type) {
      setFocusedBlockId(nextBlock.id);
      setFocusedCursorPos(0);
    } else if (block.text?.trim()) {
      const continueTypes: BlockType[] = ["bullet", "checkbox", "text"];
      addBlock(continueTypes.includes(block.type) ? block.type : "text", index);
    }
  };

  const mergeWithPrevious = (index: number) => {
    const current = blocks[index];
    if (index === 0) {
      if (!current.text) {
        onChange(blocks.filter((_, i) => i !== 0));
      }
      return;
    }
    const prev = blocks[index - 1];
    const prevText = prev.text ?? "";
    const currentText = current.text ?? "";
    
    const next = blocks.map((b, i) => {
      if (i === index - 1) {
        return { ...b, text: prevText + currentText };
      }
      return b;
    }).filter((_, i) => i !== index);
    
    setFocusedBlockId(prev.id);
    setFocusedCursorPos(prevText.length);
    onChange(next);
  };

  const updateBlock = (id: string, patch: Partial<RoutineBlockContent>) => {
    const next = blocks.map((b) => (b.id === id ? { ...b, ...patch } : b));
    // Detect "all checkboxes just became complete" → stronger haptic
    if ("checked" in patch) {
      const prevChecks = blocks.filter((b) => b.type === "checkbox" && b.text?.trim());
      const nextChecks = next.filter((b) => b.type === "checkbox" && b.text?.trim());
      const wasAll = prevChecks.length > 0 && prevChecks.every((b) => b.checked);
      const isAll = nextChecks.length > 0 && nextChecks.every((b) => b.checked);
      if (!wasAll && isAll) completionHaptic();
    }
    onChange(next);
  };

  const removeBlock = (id: string) => onChange(blocks.filter((b) => b.id !== id));

  return (
    <div className="space-y-2">
      {blocks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3 rounded-2xl border-2 border-dashed border-border/50 bg-muted/20">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <List size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">No tasks yet</p>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              {editable ? "Use the toolbox below to start building your routine." : "This routine has no content yet."}
            </p>
          </div>
        </div>
      )}

      {blocks.map((b, i) => (
        <BlockRow
          key={b.id}
          block={b}
          editable={editable}
          isFocused={b.id === focusedBlockId}
          cursorPos={b.id === focusedBlockId ? focusedCursorPos : undefined}
          onUpdate={(patch) => updateBlock(b.id, patch)}
          onRemove={() => removeBlock(b.id)}
          onEnter={() => handleEnter(i)}
          onMergeWithPrevious={() => mergeWithPrevious(i)}
        />
      ))}

      {/* Add-block toolbox — only in edit mode */}
      {editable && (
        <div className="pt-6">
          {!toolboxOpen ? (
            <button
              type="button"
              onClick={() => setToolboxOpen(true)}
              className="group flex items-center justify-center w-full gap-2 rounded-xl border border-dashed border-border py-4 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:bg-muted/50 transition-smooth active:scale-[0.98]"
            >
              <Plus size={16} strokeWidth={2.5} className="text-muted-foreground/60 group-hover:text-foreground transition-colors" />
              Add block
            </button>
          ) : (
            <div className="rounded-2xl border border-border bg-card shadow-elevated p-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Quick Add
                </p>
                <button
                  type="button"
                  onClick={() => setToolboxOpen(false)}
                  className="h-8 w-8 grid place-items-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
                  aria-label="Close toolbox"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {blockMenu.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.type}
                      type="button"
                      onClick={() => addBlock(m.type)}
                      className="group flex flex-row items-center gap-3 rounded-xl border border-border bg-background p-2.5 text-[13px] font-bold text-foreground hover:bg-muted hover:border-accent/30 hover:text-accent transition-all active:scale-[0.97]"
                    >
                      <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center group-hover:bg-accent/10 shrink-0 transition-colors">
                        <Icon size={16} strokeWidth={2.5} className="text-muted-foreground/80 group-hover:text-accent transition-colors" />
                      </div>
                      <span className="truncate">{m.label}</span>
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
  isFocused?: boolean;
  cursorPos?: number | null;
  onUpdate: (patch: Partial<RoutineBlockContent>) => void;
  onRemove: () => void;
  onEnter: () => void;
  onMergeWithPrevious: () => void;
};

const BlockRow = ({ block, editable, isFocused, cursorPos, onUpdate, onRemove, onEnter, onMergeWithPrevious }: RowProps) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const autoGrow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "0px";
    el.style.height = el.scrollHeight + "px";
  };

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
      if (typeof cursorPos === "number") {
        inputRef.current.selectionStart = cursorPos;
        inputRef.current.selectionEnd = cursorPos;
      }
    }
  }, [isFocused, cursorPos]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (!editable) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnter();
    }
    if (e.key === "Backspace" && e.currentTarget.selectionStart === 0) {
      e.preventDefault();
      onMergeWithPrevious();
    }
  };

  const ro = !editable;

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-xl px-2 py-1.5 transition-all",
        editable && "hover:bg-muted/50",
      )}
    >
      <div className="flex-1 min-w-0">
        {block.type === "divider" ? (
          <div className="py-4">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
        ) : block.type === "checkbox" ? (
          <div className="flex items-start gap-3 py-1">
            <div className="mt-0.5">
              <RoutineCheckbox
                checked={!!block.checked}
                onChange={() => {
                  if (!block.checked) successHaptic();
                  else tapHaptic();
                  onUpdate({ checked: !block.checked });
                }}
                size={20}
              />
            </div>
            <div className="relative flex-1 min-w-0">
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
                placeholder="What needs to be done?"
                className={cn(
                  "w-full bg-transparent border-0 outline-none resize-none text-[15px] font-medium leading-snug transition-all",
                  block.checked ? "text-muted-foreground/60" : "text-foreground",
                  ro && "cursor-default",
                )}
              />
              <AnimatePresence>
                {block.checked && (
                  <div className="absolute inset-0 pointer-events-none flex items-start">
                    <div className="relative inline-flex">
                      <span className="opacity-0 whitespace-pre text-[15px] font-medium leading-snug select-none">
                        {block.text || " "}
                      </span>
                      <motion.div
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        exit={{ scaleX: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                        className="absolute left-0 right-0 top-[0.7em] h-[1.5px] bg-muted-foreground/60 origin-left"
                      />
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : block.type === "bullet" ? (
          <div className="flex items-start gap-3 py-1">
            <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-accent/60 shrink-0" />
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
              placeholder="List item"
              className={cn(
                "flex-1 bg-transparent border-0 outline-none resize-none text-[15px] leading-snug",
                ro && "cursor-default",
              )}
            />
          </div>
        ) : block.type === "heading" ? (
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
            placeholder="Heading"
            className={cn(
              "w-full bg-transparent border-0 outline-none resize-none text-[26px] font-serif font-bold tracking-tight leading-tight pt-4 pb-1",
              ro && "cursor-default",
            )}
          />
        ) : block.type === "subheading" ? (
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
            placeholder="Subheading"
            className={cn(
              "w-full bg-transparent border-0 outline-none resize-none text-[17px] font-semibold tracking-tight leading-snug pt-2 pb-0.5 text-foreground/90",
              ro && "cursor-default",
            )}
          />
        ) : block.type === "quote" ? (
          <div className="border-l-[3px] border-accent/40 pl-4 py-1 my-1">
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
              placeholder="Add a note or reminder…"
              className={cn(
                "w-full bg-transparent border-0 outline-none resize-none text-[15px] leading-relaxed italic text-muted-foreground",
                ro && "cursor-default",
              )}
            />
          </div>
        ) : block.type === "link" ? (
          <div className="flex items-start gap-2.5 py-1.5">
            <LinkIcon size={14} strokeWidth={2.5} className="mt-1 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <input
                value={block.text ?? ""}
                readOnly={ro}
                onChange={(e) => onUpdate({ text: e.target.value })}
                onKeyDown={handleKey}
                placeholder="Link title"
                className={cn(
                  "w-full bg-transparent border-0 outline-none text-[15px] font-medium text-accent underline underline-offset-[3px] decoration-accent/40",
                  ro && "cursor-default",
                )}
              />
              {ro && block.url ? (
                <a
                  href={block.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[12px] text-muted-foreground hover:underline truncate"
                >
                  {block.url}
                </a>
              ) : (
                <input
                  value={block.url ?? ""}
                  readOnly={ro}
                  onChange={(e) => onUpdate({ url: e.target.value })}
                  onKeyDown={handleKey}
                  placeholder="https://…"
                  className={cn(
                    "w-full bg-transparent border-0 outline-none text-[12px] text-muted-foreground",
                    ro && "cursor-default",
                  )}
                />
              )}
            </div>
          </div>
        ) : (
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
            placeholder="Start typing…"
            className={cn(
              "w-full bg-transparent border-0 outline-none resize-none text-[15px] leading-relaxed text-muted-foreground/95 py-1",
              ro && "cursor-default",
            )}
          />
        )}
      </div>
    </div>
  );
};

/** Read-only block renderer */
export const BlockPreview = ({ blocks }: { blocks: RoutineBlockContent[] }) => {
  return (
    <div className="space-y-1.5">
      {blocks.map((b) => {
        if (b.type === "divider")
          return <div key={b.id} className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent my-3" />;
        if (b.type === "heading")
          return <h3 key={b.id} className="text-[22px] font-serif font-bold tracking-tight pt-3 pb-1">{b.text}</h3>;
        if (b.type === "subheading")
          return <h4 key={b.id} className="text-[16px] font-semibold tracking-tight pt-1 text-foreground/90">{b.text}</h4>;
        if (b.type === "bullet")
          return (
            <div key={b.id} className="flex items-start gap-2.5 py-0.5">
              <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-accent/60 shrink-0" />
              <p className="text-[15px] leading-snug">{b.text}</p>
            </div>
          );
        if (b.type === "checkbox")
          return (
            <div key={b.id} className="flex items-start gap-2.5 py-0.5">
              <span
                className={cn(
                  "mt-1 h-4 w-4 rounded-sm border flex items-center justify-center text-[10px] shrink-0",
                  b.checked ? "bg-success border-success text-success-foreground" : "border-input",
                )}
              >
                {b.checked && "✓"}
              </span>
              <p className={cn("text-[15px] leading-snug", b.checked && "line-through text-muted-foreground")}>{b.text}</p>
            </div>
          );
        if (b.type === "quote")
          return (
            <p key={b.id} className="border-l-[3px] border-accent/40 pl-4 py-1 my-1 italic text-muted-foreground text-[15px] leading-relaxed">
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
              className="flex items-start gap-2 py-1 text-[15px] text-accent font-medium underline underline-offset-[3px] decoration-accent/40 hover:decoration-accent"
            >
              <LinkIcon size={14} strokeWidth={2.5} className="mt-1 shrink-0" />
              <span className="truncate">{b.text || b.url}</span>
            </a>
          );
        return <p key={b.id} className="text-[15px] leading-relaxed text-muted-foreground/90">{b.text}</p>;
      })}
    </div>
  );
};

export type { BlockType };
