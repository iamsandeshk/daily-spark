import { Sparkles, Plus, ChevronDown, EyeOff, Eye, CheckSquare, Minus, Quote, Link2, ListTree } from "lucide-react";
import { RoutineBlockContent } from "@/lib/routine-types";
import { tapHaptic, successHaptic } from "@/lib/haptics";
import { cn, uid } from "@/lib/utils";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { type Template, TEMPLATES } from "@/lib/templates";

type Props = {
  onAdd: (template: Template) => void;
};

const COLLAPSED_KEY = "routine_templates_collapsed";

export const TemplateLibrary = ({ onAdd }: Props) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  });
  const [isPermanentlyHidden, setIsPermanentlyHidden] = useState(() => {
    return localStorage.getItem("routine_templates_hidden") === "true";
  });
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  if (isPermanentlyHidden) return null;

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, next ? "true" : "false");
      return next;
    });
  };

  const handleHide = () => {
    localStorage.setItem("routine_templates_hidden", "true");
    setIsPermanentlyHidden(true);
    tapHaptic();
  };

  return (
    <div className="mt-9 mb-8 px-1 pt-7 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      <motion.button
        layout="position"
        onClick={() => {
          tapHaptic();
          toggleCollapsed();
        }}
        className="flex items-center gap-2 mb-5 group w-full text-left outline-none"
      >
        <motion.div
          animate={{ rotate: isCollapsed ? -90 : 0 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="text-muted-foreground/40 group-hover:text-accent transition-colors"
        >
          <ChevronDown size={14} strokeWidth={3} />
        </motion.div>
        <Sparkles size={14} className="text-accent" strokeWidth={2.5} />
        <motion.h3 
          layout="position"
          className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 group-hover:text-foreground transition-colors"
        >
          Template Library
        </motion.h3>
      </motion.button>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.25, ease: "linear" },
            }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 pb-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.title}
                  onClick={() => {
                    tapHaptic();
                    setPreviewTemplate(t);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-2xl border border-border bg-card/60 text-left transition-all",
                    "hover:border-border hover:bg-card active:scale-[0.99] group",
                  )}
                >
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-secondary/80 border border-border/60 flex items-center justify-center text-xl">
                    {t.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[14px] text-foreground leading-tight">{t.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {t.description}
                    </p>
                  </div>
                  <div className="h-7 w-7 shrink-0 rounded-full bg-secondary/70 text-muted-foreground flex items-center justify-center group-hover:text-foreground transition-colors">
                    <Eye size={14} />
                  </div>
                </button>
              ))}

              <div className="flex justify-center pt-5 pb-1">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/60 hover:text-destructive transition-colors outline-none group py-1">
                      <EyeOff size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      Hide Template Library
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl p-6 gap-5 max-w-[90vw] sm:max-w-md">
                    <AlertDialogHeader className="space-y-2">
                      <AlertDialogTitle className="text-xl font-bold text-center sm:text-left">Hide the Library?</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground text-center sm:text-left text-sm">
                        This will remove the Template Library from your Home screen. You can always restore it from settings.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-row gap-2.5 sm:justify-end">
                      <AlertDialogCancel className="flex-1 rounded-xl h-11 font-semibold">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleHide}
                        className="flex-1 rounded-xl h-11 font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Hide
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={!!previewTemplate} onOpenChange={(o) => !o && setPreviewTemplate(null)}>
        <DialogContent className="rounded-2xl p-0 gap-0 max-w-[92vw] sm:max-w-md overflow-hidden bg-card border-border">
          {previewTemplate && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 space-y-2 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-secondary/80 border border-border/60 flex items-center justify-center text-2xl">
                    {previewTemplate.emoji}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <DialogTitle className="text-lg font-bold tracking-tight leading-tight">
                      {previewTemplate.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      {previewTemplate.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="max-h-[55vh] overflow-y-auto px-6 py-4 space-y-1.5">
                {previewTemplate.blocks.map((b, i) => (
                  <PreviewBlockRow key={i} block={b} />
                ))}
              </div>

              <DialogFooter className="flex flex-row gap-3 sm:justify-end px-6 py-4 border-t border-border bg-muted/20">
                <Button
                  variant="outline"
                  onClick={() => setPreviewTemplate(null)}
                  className="flex-1 rounded-2xl h-11 font-semibold border-border/60"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    successHaptic();
                    onAdd(previewTemplate);
                    setPreviewTemplate(null);
                  }}
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

const PreviewBlockRow = ({ block }: { block: Omit<RoutineBlockContent, "id"> }) => {
  switch (block.type) {
    case "heading":
      return <div className="text-base font-bold text-foreground pt-2">{block.text}</div>;
    case "subheading":
      return (
        <div className="flex items-center gap-1.5 pt-2">
          <ListTree size={12} className="text-accent" strokeWidth={2.5} />
          <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            {block.text}
          </div>
        </div>
      );
    case "checkbox":
      return (
        <div className="flex items-center gap-2 text-[13px] text-foreground/90">
          <CheckSquare size={14} className="text-muted-foreground/60 shrink-0" strokeWidth={2} />
          <span className="truncate">{block.text}</span>
        </div>
      );
    case "bullet":
      return (
        <div className="flex items-start gap-2 text-[13px] text-foreground/80 pl-1">
          <span className="text-muted-foreground/60 mt-0.5">•</span>
          <span>{block.text}</span>
        </div>
      );
    case "quote":
      return (
        <div className="flex items-start gap-2 text-[12px] italic text-muted-foreground border-l-2 border-accent/40 pl-2.5 py-1">
          <Quote size={11} className="text-accent/60 mt-0.5 shrink-0" />
          <span>{block.text}</span>
        </div>
      );
    case "link":
      return (
        <div className="flex items-center gap-2 text-[13px] text-accent">
          <Link2 size={13} strokeWidth={2.5} className="shrink-0" />
          <span className="truncate">{block.text}</span>
        </div>
      );
    case "routine":
      return (
        <div className="flex items-center gap-2 text-[13px] font-medium text-foreground/90 rounded-lg bg-accent/5 border border-accent/10 px-2 py-1.5">
          <Sparkles size={12} className="text-accent shrink-0" strokeWidth={2.5} />
          <span className="truncate">Linked routine: {block.text}</span>
        </div>
      );
    case "divider":
      return <div className="flex items-center gap-2 py-1"><div className="flex-1 h-px bg-border" /></div>;
    default:
      return <div className="text-[13px] text-foreground/80">{block.text}</div>;
  }
};
