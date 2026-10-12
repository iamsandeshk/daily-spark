import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  checked: boolean;
  onChange: () => void;
  size?: number;
  accentColor?: string;
};

export const RoutineCheckbox = ({ checked, onChange, size = 22, accentColor }: Props) => {
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={checked ? "Mark as incomplete" : "Mark as complete"}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        "relative shrink-0 rounded-[7px] border transition-all duration-200 flex items-center justify-center active:scale-90",
        checked
          ? "border-transparent text-white shadow-sm"
          : "bg-background/80 border-border/80 hover:border-foreground/40",
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: checked ? (accentColor || "hsl(var(--accent))") : undefined,
      }}
    >
      <motion.span
        initial={false}
        animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 450, damping: 26 }}
        className="flex items-center justify-center"
      >
        <Check size={size * 0.72} strokeWidth={3} />
      </motion.span>
    </button>
  );
};
