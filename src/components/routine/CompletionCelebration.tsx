import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(20 90% 60%)",
  "hsl(280 80% 65%)",
  "hsl(45 95% 60%)",
  "hsl(160 70% 50%)",
];

interface Props {
  show: boolean;
  onDone?: () => void;
}

export const CompletionCelebration = ({ show, onDone }: Props) => {
  const [pieces] = useState(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 1.6 + Math.random() * 1.2,
      rotate: Math.random() * 720 - 360,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 8,
    }))
  );

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onDone?.(), 2600);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
        >
          {/* Confetti */}
          {pieces.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: -40, x: `${p.x}vw`, opacity: 0, rotate: 0 }}
              animate={{
                y: "110vh",
                opacity: [0, 1, 1, 0],
                rotate: p.rotate,
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: "easeIn",
              }}
              style={{
                position: "absolute",
                width: p.size,
                height: p.size * 1.6,
                background: p.color,
                borderRadius: 2,
              }}
            />
          ))}

          {/* Center badge */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-3xl bg-card/90 backdrop-blur-xl border border-border shadow-elevated">
              <motion.div
                animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
                transition={{ duration: 0.9, ease: "easeInOut" }}
                className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground"
              >
                <Sparkles size={28} strokeWidth={2.5} />
              </motion.div>
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">All done!</div>
                <div className="text-xs text-muted-foreground">
                  Every task complete · Great work
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
