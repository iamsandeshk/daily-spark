import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Crown, Lock, Palette, Type, LayoutDashboard, Smile, RotateCcw, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { tapHaptic } from "@/lib/haptics";
import { COLOR_THEMES, getColorTheme, setColorTheme, type ColorThemeId } from "@/lib/color-themes";
import { FONTS, DENSITIES, getFont, getDensity, setFont, setDensity, type FontId, type DensityId } from "@/lib/appearance";
import { isPro } from "@/lib/pro";
import {
  getMoodConfig, setMoodConfigItem, resetMoodConfig,
  MOOD_ORDER, MOOD_DEFAULTS, type MoodConfig,
} from "@/lib/mood-customization";
import type { MoodValue } from "@/lib/routine-types";
import { EmojiPicker } from "@/components/routine/EmojiPicker";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1 mt-7 mb-2.5">
    {children}
  </h3>
);

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("rounded-2xl border border-border bg-card overflow-hidden", className)}>{children}</div>
);

const Customization = () => {
  const navigate = useNavigate();
  const [colorThemeId, setColorThemeIdState] = useState<ColorThemeId>(getColorTheme());
  const [fontId, setFontIdState] = useState<FontId>(getFont());
  const [densityId, setDensityIdState] = useState<DensityId>(getDensity());
  const [proEnabled, setProEnabled] = useState<boolean>(isPro());
  const [moods, setMoods] = useState<MoodConfig>(getMoodConfig());
  const [emojiFor, setEmojiFor] = useState<MoodValue | null>(null);
  const [nameEditing, setNameEditing] = useState<MoodValue | null>(null);
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    const onPro = () => setProEnabled(isPro());
    const onMoods = () => setMoods(getMoodConfig());
    window.addEventListener("pro:updated", onPro);
    window.addEventListener("mood-config:updated", onMoods);
    return () => {
      window.removeEventListener("pro:updated", onPro);
      window.removeEventListener("mood-config:updated", onMoods);
    };
  }, []);

  const commitName = (mood: MoodValue) => {
    const trimmed = nameDraft.trim();
    setMoodConfigItem(mood, { name: trimmed || MOOD_DEFAULTS[mood].name });
    setNameEditing(null);
    tapHaptic();
  };

  return (
    <div className="min-h-full bg-background pb-20 no-select">
      <header className="sticky top-0 z-30 bg-background safe-top px-5 pb-3 pt-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-serif font-bold">Customization</h1>
      </header>

      <main className="px-5">
        <SectionLabel>Appearance</SectionLabel>
        <Card className="p-4 space-y-5">
          {/* Color theme */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold">
                <Palette size={13} /> Color theme
              </span>
              {!proEnabled && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-accent">
                  <Crown size={10} /> Pro
                </span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {COLOR_THEMES.map((t) => {
                const active = colorThemeId === t.id;
                const locked = t.pro && !proEnabled;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (locked) { tapHaptic(); navigate("/settings/pro"); return; }
                      setColorTheme(t.id);
                      setColorThemeIdState(t.id);
                      tapHaptic();
                    }}
                    aria-label={t.name}
                    className={cn(
                      "relative aspect-square rounded-2xl border-2 transition-all flex items-center justify-center",
                      active ? "border-foreground scale-[0.96]" : "border-border hover:border-muted-foreground/40"
                    )}
                    style={{ backgroundColor: t.swatch }}
                  >
                    {active && <Check size={16} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" strokeWidth={3} />}
                    {locked && !active && (
                      <div className="absolute inset-0 rounded-xl bg-background/55 flex items-center justify-center">
                        <Lock size={12} className="text-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 px-0.5">
              {COLOR_THEMES.find((t) => t.id === colorThemeId)?.name}
              {!proEnabled && " · Tap a locked color to unlock with Pro"}
            </p>
          </div>

          <div className="h-px bg-border -mx-4" />

          {/* Font */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold">
                <Type size={13} /> Font
              </span>
              {!proEnabled && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-accent">
                  <Crown size={10} /> Pro
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {FONTS.map((f) => {
                const active = fontId === f.id;
                const locked = f.pro && !proEnabled;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      if (locked) { tapHaptic(); navigate("/settings/pro"); return; }
                      setFont(f.id);
                      setFontIdState(f.id);
                      tapHaptic();
                    }}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border transition-all",
                      active ? "border-foreground bg-foreground/5" : "border-border bg-background hover:bg-muted/60"
                    )}
                  >
                    <span className="text-xl leading-none" style={{ fontFamily: f.family }}>{f.sample}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground truncate max-w-full px-1">{f.name}</span>
                    {locked && !active && (
                      <div className="absolute inset-0 rounded-2xl bg-background/55 flex items-center justify-center">
                        <Lock size={12} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-border -mx-4" />

          {/* Layout density */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold">
                <LayoutDashboard size={13} /> Layout density
              </span>
              {!proEnabled && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-accent">
                  <Crown size={10} /> Pro
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DENSITIES.map((d) => {
                const active = densityId === d.id;
                const locked = !proEnabled && d.id !== "cozy";
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      if (locked) { tapHaptic(); navigate("/settings/pro"); return; }
                      setDensity(d.id);
                      setDensityIdState(d.id);
                      tapHaptic();
                    }}
                    className={cn(
                      "relative flex flex-col items-center gap-1 py-3.5 rounded-2xl border transition-all",
                      active ? "border-foreground bg-foreground/5" : "border-border bg-background hover:bg-muted/60"
                    )}
                  >
                    <span className="text-[13px] font-bold">{d.name}</span>
                    <span className="text-[10px] text-muted-foreground">{d.hint}</span>
                    {locked && !active && (
                      <div className="absolute inset-0 rounded-2xl bg-background/55 flex items-center justify-center">
                        <Lock size={12} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <SectionLabel>Moods</SectionLabel>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold">
              <Smile size={13} /> Mood emoji & names
            </span>
            {proEnabled ? (
              <button
                onClick={() => { resetMoodConfig(); tapHaptic(); }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                <RotateCcw size={11} /> Reset
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-accent">
                <Crown size={10} /> Pro
              </span>
            )}
          </div>

          <div className="relative">
            <div className={cn("space-y-2", !proEnabled && "pointer-events-none blur-[2px] opacity-60")}>
              {MOOD_ORDER.map((m) => {
                const cfg = moods[m];
                const editing = nameEditing === m;
                return (
                  <div
                    key={m}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2.5"
                  >
                    <button
                      onClick={() => { setEmojiFor(m); tapHaptic(); }}
                      className="h-11 w-11 grid place-items-center rounded-xl bg-muted/60 hover:bg-muted active:scale-95 transition-all text-2xl leading-none"
                      aria-label={`Change emoji for ${cfg.name}`}
                    >
                      {cfg.emoji}
                    </button>

                    <div className="flex-1 min-w-0">
                      {editing ? (
                        <input
                          autoFocus
                          value={nameDraft}
                          maxLength={20}
                          onChange={(e) => setNameDraft(e.target.value)}
                          onBlur={() => commitName(m)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            if (e.key === "Escape") setNameEditing(null);
                          }}
                          className="w-full bg-transparent text-[15px] font-semibold outline-none border-b border-accent pb-0.5"
                        />
                      ) : (
                        <button
                          onClick={() => { setNameDraft(cfg.name); setNameEditing(m); tapHaptic(); }}
                          className="flex items-center gap-1.5 text-left"
                        >
                          <span className="text-[15px] font-semibold">{cfg.name}</span>
                          <Pencil size={12} className="text-muted-foreground" />
                        </button>
                      )}
                      <div className="text-[11px] text-muted-foreground uppercase tracking-[0.1em] mt-0.5">
                        {m}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!proEnabled && (
              <button
                onClick={() => { tapHaptic(); navigate("/settings/pro"); }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-background/40"
                aria-label="Unlock mood customization with Pro"
              >
                <div className="flex items-center justify-center h-11 w-11 rounded-full bg-accent/15 text-accent">
                  <Lock size={18} />
                </div>
                <span className="text-[13px] font-bold text-foreground">Unlock with Pro</span>
                <span className="text-[11px] text-muted-foreground">Customize mood emoji &amp; names</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground mt-3 px-0.5">
            {proEnabled
              ? "Tap the emoji to change it, or tap the name to rename. Used everywhere moods appear."
              : "Personalize each mood's emoji and name with Pro."}
          </p>
        </Card>
      </main>

      <EmojiPicker
        open={emojiFor !== null}
        value={emojiFor ? moods[emojiFor].emoji : ""}
        onClose={() => setEmojiFor(null)}
        onSelect={(e) => {
          if (!emojiFor) return;
          setMoodConfigItem(emojiFor, { emoji: e });
          setEmojiFor(null);
        }}
      />
    </div>
  );
};

export default Customization;
