import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Flame, Trash2 } from "lucide-react";
import { useRoutines } from "@/hooks/useRoutines";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tapHaptic } from "@/lib/haptics";
import { BlockEditor } from "@/components/routine/BlockEditor";
import type { RoutineBlockContent } from "@/lib/routine-types";

const emojiPresets = ["✨", "💧", "🧘", "🏃", "📖", "🎯", "💪", "🍎", "🌅", "🌙", "📚", "🎨", "💼", "☕", "🛌", "🧠"];

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

  // Redirect if editing nonexistent routine
  useEffect(() => {
    if (!isNew && !existing && r.state.routines.length > 0) navigate("/", { replace: true });
  }, [isNew, existing, navigate, r.state.routines.length]);

  const save = () => {
    if (!title.trim() || !sectionId) return;
    // Derive a plain-text description from the first text-like block for list preview.
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
            {existing && (
              <button
                onClick={remove}
                className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth"
                aria-label="Delete"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={save}
              disabled={!title.trim()}
              className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              <Check size={16} strokeWidth={2.5} />
              {isNew ? "Create" : "Save"}
            </button>
          </div>
        </div>
      </header>

      <main className="px-5 pt-6 space-y-5">
        {/* Notion-like big emoji + title */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              const i = emojiPresets.indexOf(emoji);
              setEmoji(emojiPresets[(i + 1) % emojiPresets.length]);
            }}
            className="text-6xl leading-none hover:scale-105 transition-transform"
            aria-label="Change icon"
          >
            {emoji}
          </button>
          <input
            autoFocus={isNew}
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

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={sectionId} onValueChange={setSectionId}>
            <SelectTrigger className="h-8 w-auto gap-1.5 rounded-full border-border bg-muted/60 px-3 text-xs font-medium">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              {sortedSections.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.emoji} {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <details className="relative">
            <summary className="list-none inline-flex items-center gap-1.5 h-8 rounded-full border border-border bg-muted/60 px-3 text-xs font-medium cursor-pointer select-none">
              <span>{emoji}</span> Icon
            </summary>
            <div className="absolute z-20 mt-2 rounded-lg border border-border bg-popover p-2 shadow-elevated">
              <div className="grid grid-cols-8 gap-1">
                {emojiPresets.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`h-8 w-8 rounded-md text-base transition-smooth ${
                      emoji === e ? "bg-accent-soft" : "hover:bg-muted"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </details>
        </div>

        <div className="h-px bg-border" />

        {/* Notion-style block editor */}
        <BlockEditor blocks={blocks} onChange={setBlocks} />
      </main>
    </div>
  );
};

export default RoutineDetail;
