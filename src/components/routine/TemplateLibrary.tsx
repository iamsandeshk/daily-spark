import { Sparkles, Plus, ChevronDown, EyeOff } from "lucide-react";
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

type Template = {
  title: string;
  emoji: string;
  description: string;
  blocks: Omit<RoutineBlockContent, "id">[];
};

export const TEMPLATES: Template[] = [
  {
    title: "Study Session",
    emoji: "📚",
    description: "Deep focus block for learning.",
    blocks: [
      { type: "subheading", text: "Session setup" },
      { type: "checkbox", text: "Phone on Do Not Disturb", checked: false },
      { type: "checkbox", text: "Water + snack ready", checked: false },
      { type: "checkbox", text: "Topic written down", checked: false },
      { type: "divider" },
      { type: "subheading", text: "Learning blocks" },
      { type: "checkbox", text: "Pomodoro 1 — 25 min", checked: false },
      { type: "checkbox", text: "Break — 5 min", checked: false },
      { type: "checkbox", text: "Pomodoro 2 — 25 min", checked: false },
      { type: "checkbox", text: "Break — 5 min", checked: false },
      { type: "divider" },
      { type: "subheading", text: "Key takeaways" },
      { type: "bullet", text: "First main concept from session" },
      { type: "bullet", text: "Second thing I learned" },
      { type: "bullet", text: "Questions to revisit tomorrow" },
      { type: "divider" },
      { type: "link", text: "Khan Academy", url: "https://khanacademy.org" },
      { type: "link", text: "My notes folder", url: "https://drive.google.com" },
    ],
  },
  {
    title: "Fitness",
    emoji: "💪",
    description: "Full workout from warm-up to cooldown.",
    blocks: [
      { type: "quote", text: "The only bad workout is the one that didn't happen." },
      { type: "divider" },
      { type: "subheading", text: "Warm up" },
      { type: "checkbox", text: "Jumping jacks — 2 min", checked: false },
      { type: "checkbox", text: "Arm circles + hip rolls", checked: false },
      { type: "checkbox", text: "Light jog on spot", checked: false },
      { type: "divider" },
      { type: "subheading", text: "Strength" },
      { type: "checkbox", text: "Push ups — 3 × 15", checked: false },
      { type: "checkbox", text: "Squats — 3 × 20", checked: false },
      { type: "checkbox", text: "Plank — 3 × 45s", checked: false },
      { type: "checkbox", text: "Lunges — 3 × 12 each", checked: false },
      { type: "divider" },
      { type: "subheading", text: "Cardio (optional)" },
      { type: "checkbox", text: "15 min run or cycle", checked: false },
      { type: "divider" },
      { type: "quote", text: "Action is the foundational key to all success." },
      { type: "subheading", text: "Cool down" },
      { type: "checkbox", text: "Stretching — 10 min", checked: false },
      { type: "checkbox", text: "2L water goal", checked: false },
    ],
  },
  {
    title: "Deep Work",
    emoji: "💻",
    description: "Protect your most productive hours.",
    blocks: [
      { type: "subheading", text: "Before you start" },
      { type: "checkbox", text: "Single task written down", checked: false },
      { type: "checkbox", text: "All notifications off", checked: false },
      { type: "checkbox", text: "Workspace cleared", checked: false },
      { type: "divider" },
      { type: "subheading", text: "Work blocks" },
      { type: "checkbox", text: "Block 1 — 90 min", checked: false },
      { type: "checkbox", text: "Break — 15 min (walk)", checked: false },
      { type: "checkbox", text: "Block 2 — 90 min", checked: false },
      { type: "divider" },
      { type: "subheading", text: "Rules during work" },
      { type: "bullet", text: "No social media or news" },
      { type: "bullet", text: "Only task-related tabs open" },
      { type: "bullet", text: "Write blockers, don't solve them now" },
      { type: "divider" },
      { type: "subheading", text: "End of session review" },
      { type: "checkbox", text: "Task completed or % done noted", checked: false },
      { type: "checkbox", text: "Tomorrow's first task written", checked: false },
    ],
  },
  {
    title: "Wind Down",
    emoji: "🌙",
    description: "Prepare your mind for restful sleep.",
    blocks: [
      { type: "subheading", text: "Digital detox" },
      { type: "checkbox", text: "All screens off", checked: false },
      { type: "checkbox", text: "Phone in other room", checked: false },
      { type: "divider" },
      { type: "subheading", text: "Deep session" },
      { type: "routine", text: "Deep Work" },
      { type: "divider" },
      { type: "subheading", text: "Reflection" },
      { type: "checkbox", text: "Plan top 3 for tomorrow", checked: false },
      { type: "checkbox", text: "Journal: 3 wins today", checked: false },
      { type: "divider" },
      { type: "subheading", text: "Rest" },
      { type: "checkbox", text: "Light stretching", checked: false },
      { type: "checkbox", text: "Read fiction (paper book)", checked: false },
    ],
  },
];

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
    <div className="mt-12 mb-8 px-1">
      <motion.button
        layout="position"
        onClick={() => {
          tapHaptic();
          setIsCollapsed(!isCollapsed);
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
            <div className="space-y-3 pb-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.title}
                  onClick={() => {
                    successHaptic();
                    onAdd(t);
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
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {t.description}
                    </p>
                  </div>
                  <div className="h-8 w-8 shrink-0 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all">
                    <Plus size={16} strokeWidth={3} />
                  </div>
                </button>
              ))}

              <div className="flex justify-center pt-6 pb-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 hover:text-destructive transition-colors outline-none group">
                      <EyeOff size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      Hide Template Library
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-[28px] p-8 gap-6 max-w-[90vw] sm:max-w-md">
                    <AlertDialogHeader className="space-y-3">
                      <AlertDialogTitle className="text-2xl font-serif font-bold text-center sm:text-left">Hide the Library?</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground text-center sm:text-left text-[15px]">
                        This will remove the Template Library from your dashboard. You can always bring it back later from settings.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-row gap-3 sm:justify-end">
                      <AlertDialogCancel className="flex-1 rounded-2xl h-12 font-bold border-border/60 hover:bg-muted">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleHide}
                        className="flex-1 rounded-2xl h-12 font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20"
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
    </div>
  );
};
