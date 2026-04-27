import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Flame, Trash2 } from "lucide-react";
import { useRoutines } from "@/hooks/useRoutines";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tapHaptic } from "@/lib/haptics";

const emojiPresets = ["✨", "💧", "🧘", "🏃", "📖", "🎯", "💪", "🍎", "🌅", "🌙", "📚", "🎨", "💼", "☕", "🛌", "🧠"];

const RoutineDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const r = useRoutines();

  const isNew = id === "new";
  const existing = useMemo(() => (isNew ? undefined : r.state.routines.find((x) => x.id === id)), [id, isNew, r.state.routines]);

  const sortedSections = [...r.state.sections].sort((a, b) => a.order - b.order);
  const initialSection = params.get("section") ?? sortedSections[0]?.id ?? "";

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [emoji, setEmoji] = useState(existing?.emoji ?? "✨");
  const [sectionId, setSectionId] = useState(existing?.sectionId ?? initialSection);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description ?? "");
      setEmoji(existing.emoji ?? "✨");
      setSectionId(existing.sectionId);
    }
  }, [existing]);

  // Redirect if editing nonexistent routine
  useEffect(() => {
    if (!isNew && !existing && r.state.routines.length > 0) navigate("/", { replace: true });
  }, [isNew, existing, navigate, r.state.routines.length]);

  const save = () => {
    if (!title.trim() || !sectionId) return;
    if (isNew) {
      r.addRoutine({ title: title.trim(), description: description.trim() || undefined, emoji, sectionId });
    } else if (existing) {
      r.updateRoutine(existing.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        emoji,
        sectionId,
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

      <main className="px-5 pt-6 space-y-6">
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

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Notes</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details, reminders, or context…"
            rows={4}
            className="resize-none text-base"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Section</label>
          <Select value={sectionId} onValueChange={setSectionId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a section" />
            </SelectTrigger>
            <SelectContent>
              {sortedSections.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.emoji} {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {emojiPresets.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`h-10 w-10 rounded-md border text-lg transition-smooth ${
                  emoji === e ? "border-accent bg-accent-soft" : "border-border hover:bg-muted"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoutineDetail;
