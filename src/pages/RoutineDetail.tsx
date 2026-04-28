import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Flame, Trash2, Pencil } from "lucide-react";
import { useRoutines } from "@/hooks/useRoutines";
import { tapHaptic } from "@/lib/haptics";
import { BlockEditor } from "@/components/routine/BlockEditor";
import { EmojiPicker } from "@/components/routine/EmojiPicker";
import { SectionPicker } from "@/components/routine/SectionPicker";
import type { RoutineBlockContent } from "@/lib/routine-types";
import { cn } from "@/lib/utils";

const RoutineDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const r = useRoutines();

  const isNew = id === "new";
  const existing = useMemo(
    () => (isNew ? undefined : r.state.routines.find((x) => x.id === id)),
    [id, isNew, r.state.routines],
  );

  const sortedSections = [...r.state.sections].sort((a, b) => a.order - b.order);
  const initialSection = params.get("section") ?? sortedSections[0]?.id ?? "";

  const [title, setTitle] = useState(existing?.title ?? "");
  const [emoji, setEmoji] = useState(existing?.emoji ?? "✨");
  const [sectionId, setSectionId] = useState(existing?.sectionId ?? initialSection);
  const [blocks, setBlocks] = useState<RoutineBlockContent[]>(
    existing?.blocks ??
      (existing?.description
        ? [{ id: "legacy", type: "text", text: existing.description }]
        : []),
  );
  const [emojiOpen, setEmojiOpen] = useState(false);
  // New routines start in edit mode; existing routines start locked
  const [editing, setEditing] = useState(isNew);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setEmoji(existing.emoji ?? "✨");
      setSectionId(existing.sectionId);
      setBlocks(
        existing.blocks ??
          (existing.description
            ? [{ id: "legacy", type: "text", text: existing.description }]
            : []),
      );
    }
  }, [existing]);

  useEffect(() => {
    if (!isNew && !existing && r.state.routines.length > 0) navigate("/", { replace: true });
  }, [isNew, existing, navigate, r.state.routines.length]);

  const save = () => {
    if (!title.trim() || !sectionId) return;
    const firstText = blocks.find((b) => ["text", "quote", "subheading"].includes(b.type) && b.text?.trim());
    const description = firstText?.text?.trim() || undefined;

    if (isNew) {
      r.addRoutine({ title: title.trim(), description, emoji, sectionId, blocks });
    } else if (existing) {
      r.updateRoutine(existing.id, {
        title: title.trim(),
        description,
        emoji,
        sectionId,
        blocks,
      });
    }
    tapHaptic();
    navigate("/");
  };

  const remove = () => {
    if (!existing) return;
    if (!confirm(`Delete "${existing.title}"?`)) return;
    r.deleteRoutine(existing.id);
    navigate("/");
  };

  return (
    <div className="min-h-full bg-background pb-24">
      <header className="safe-top sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-2 py-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-1">
            {existing && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <Pencil size={13} strokeWidth={2.5} />
                Edit
              </button>
            )}
            {existing && editing && (
              <button
                onClick={remove}
                className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth"
                aria-label="Delete"
              >
                <Trash2 size={18} />
              </button>
            )}
            {editing && (
              <button
                onClick={save}
                disabled={!title.trim()}
                className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                <Check size={16} strokeWidth={2.5} />
                {isNew ? "Create" : "Save"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="px-5 pt-6 space-y-5">
        <div className="space-y-3">
          <button
            type="button"
            disabled={!editing}
            onClick={() => setEmojiOpen(true)}
            className={cn(
              "text-6xl leading-none transition-transform",
              editing && "hover:scale-105 active:scale-95",
              !editing && "cursor-default",
            )}
            aria-label="Change icon"
          >
            {emoji}
          </button>
          <input
            autoFocus={isNew}
            readOnly={!editing}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled routine"
            className="w-full bg-transparent border-0 outline-none text-3xl font-semibold tracking-tight placeholder:text-muted-foreground/50"
          />
          {existing && existing.streakCount > 0 && (
            <div className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
              <Flame size={12} strokeWidth={2.5} />
              {existing.streakCount} day streak
            </div>
          )}
        </div>

        {editing && (
          <div className="flex flex-wrap items-center gap-2">
            <SectionPicker
              sections={sortedSections}
              value={sectionId}
              onChange={setSectionId}
              onCreateSection={r.addSection}
            />
            <button
              type="button"
              onClick={() => setEmojiOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 rounded-full border border-border bg-muted/60 px-3 text-xs font-medium"
            >
              <span>{emoji}</span> Change icon
            </button>
          </div>
        )}

        <div className="h-px bg-border" />

        <BlockEditor blocks={blocks} onChange={setBlocks} editable={editing} />
      </main>

      <EmojiPicker
        open={emojiOpen}
        value={emoji}
        onClose={() => setEmojiOpen(false)}
        onSelect={setEmoji}
      />
    </div>
  );
};

export default RoutineDetail;
