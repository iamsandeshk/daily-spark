import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Eye } from "lucide-react";
import { TEMPLATES } from "@/components/routine/TemplateLibrary";
import { BlockPreview } from "@/components/routine/BlockEditor";
import { useRoutines } from "@/hooks/useRoutines";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, uid } from "@/lib/utils";
import { tapHaptic, successHaptic } from "@/lib/haptics";
import type { RoutineBlockContent } from "@/lib/routine-types";

const Templates = () => {
  const navigate = useNavigate();
  const r = useRoutines();
  const [previewTpl, setPreviewTpl] = useState<typeof TEMPLATES[number] | null>(null);

  const handleAdd = (t: typeof TEMPLATES[number]) => {
    const sectionId = r.state.sections[0]?.id || r.addSection("Routines");
    const blocks: RoutineBlockContent[] = t.blocks.map((b) => ({ ...b, id: uid() }));
    r.addRoutine({ title: t.title, emoji: t.emoji, description: t.description, sectionId, blocks });
    successHaptic();
    setPreviewTpl(null);
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
          <h1 className="text-2xl font-serif font-bold">Templates</h1>
          <p className="text-xs text-muted-foreground">Tap to preview a ready-made routine</p>
        </div>
      </header>

      <main className="px-5 space-y-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.title}
            onClick={() => {
              tapHaptic();
              setPreviewTpl(t);
            }}
            className={cn(
              "w-full flex items-center gap-3.5 p-3 rounded-2xl border border-border bg-card text-left transition-all",
              "hover:border-accent/40 hover:shadow-block active:scale-[0.98] group",
            )}
          >
            <div className="h-11 w-11 shrink-0 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              {t.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-[15px] text-foreground leading-tight">{t.title}</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{t.description}</p>
            </div>
            <div className="h-8 w-8 shrink-0 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all">
              <Eye size={15} strokeWidth={2.5} />
            </div>
          </button>
        ))}
      </main>

      <Dialog open={!!previewTpl} onOpenChange={(o) => !o && setPreviewTpl(null)}>
        <DialogContent className="rounded-[28px] p-0 gap-0 max-w-[92vw] sm:max-w-md overflow-hidden">
          {previewTpl && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 space-y-2 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-center text-2xl">
                    {previewTpl.emoji}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <DialogTitle className="text-xl font-serif font-bold leading-tight">
                      {previewTpl.title}
                    </DialogTitle>
                    <DialogDescription className="text-[12px] text-muted-foreground mt-0.5">
                      {previewTpl.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="max-h-[55vh] overflow-y-auto px-6 py-4">
                <BlockPreview blocks={previewTpl.blocks as any} />
              </div>
              <DialogFooter className="flex flex-row gap-3 sm:justify-end px-6 py-4 border-t border-border bg-muted/20">
                <Button
                  variant="outline"
                  onClick={() => setPreviewTpl(null)}
                  className="flex-1 rounded-2xl h-11 font-semibold border-border/60"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAdd(previewTpl)}
                  className="flex-1 rounded-2xl h-11 font-bold bg-foreground text-background hover:bg-foreground/90"
                >
                  <Plus size={15} strokeWidth={3} className="mr-1" />
                  Add template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;
