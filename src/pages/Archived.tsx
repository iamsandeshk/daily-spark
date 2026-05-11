import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArchiveRestore, Eye } from "lucide-react";
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
import { tapHaptic, successHaptic } from "@/lib/haptics";

const Archived = () => {
  const navigate = useNavigate();
  const r = useRoutines();
  const archived = r.state.routines.filter((x) => x.archived);
  const [preview, setPreview] = useState<typeof archived[number] | null>(null);

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
          <h1 className="text-2xl font-serif font-bold">Archived routines</h1>
          <p className="text-xs text-muted-foreground">Tap to preview or unarchive</p>
        </div>
      </header>

      <main className="px-5 space-y-2">
        {archived.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12">
            You haven't archived anything yet.
          </div>
        ) : (
          archived.map((rt) => (
            <button
              key={rt.id}
              onClick={() => {
                tapHaptic();
                setPreview(rt);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border bg-card text-left transition-all hover:border-accent/40 hover:shadow-block active:scale-[0.98]"
            >
              <div className="h-10 w-10 shrink-0 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-center text-xl">
                {rt.emoji || "✨"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold truncate">{rt.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {(rt.blocks ?? []).filter((b) => b.type === "checkbox" || b.type === "timer").length} tasks
                </p>
              </div>
              <Eye size={15} className="text-muted-foreground/60 shrink-0" />
            </button>
          ))
        )}
      </main>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="rounded-[28px] p-0 gap-0 max-w-[92vw] sm:max-w-md overflow-hidden">
          {preview && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 space-y-2 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-center text-2xl">
                    {preview.emoji || "✨"}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <DialogTitle className="text-xl font-serif font-bold leading-tight">
                      {preview.title}
                    </DialogTitle>
                    {preview.description && (
                      <DialogDescription className="text-[12px] text-muted-foreground mt-0.5">
                        {preview.description}
                      </DialogDescription>
                    )}
                  </div>
                </div>
              </DialogHeader>
              <div className="max-h-[55vh] overflow-y-auto px-6 py-4">
                <BlockPreview blocks={preview.blocks ?? []} />
              </div>
              <DialogFooter className="flex flex-row gap-3 sm:justify-end px-6 py-4 border-t border-border bg-muted/20">
                <Button
                  variant="outline"
                  onClick={() => setPreview(null)}
                  className="flex-1 rounded-2xl h-11 font-semibold border-border/60"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    r.updateRoutine(preview.id, { archived: false });
                    successHaptic();
                    setPreview(null);
                  }}
                  className="flex-1 rounded-2xl h-11 font-bold bg-foreground text-background hover:bg-foreground/90"
                >
                  <ArchiveRestore size={15} strokeWidth={2.5} className="mr-1.5" />
                  Unarchive
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Archived;
