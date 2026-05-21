import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { tapHaptic } from "@/lib/haptics";

interface Props {
  show: boolean;
  streakGoal: number;
  onClose: () => void;
}

const GOLD_COLORS = [
  "hsl(45, 100%, 55%)",  // Bright gold
  "hsl(40, 100%, 65%)",  // Champagne gold
  "hsl(35, 100%, 50%)",  // Amber gold
  "hsl(50, 100%, 75%)",  // Pale gold
  "hsl(24, 100%, 60%)",  // Bronze gold
];

export const StreakGoalCelebration = ({ show, streakGoal, onClose }: Props) => {
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; delay: number; scale: number; color: string }[]>([]);

  useEffect(() => {
    if (show) {
      tapHaptic();
      // Generate randomized sparkling gold background elements
      const newSparkles = Array.from({ length: 32 }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // percentage width
        y: Math.random() * 100, // percentage height
        delay: Math.random() * 0.8,
        scale: 0.5 + Math.random() * 0.8,
        color: GOLD_COLORS[i % GOLD_COLORS.length],
      }));
      setSparkles(newSparkles);
    }
  }, [show]);

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-[32px] p-0 overflow-hidden border-border bg-gradient-to-br from-amber-950/20 via-background to-amber-900/10 shadow-[0_0_50px_rgba(251,191,36,0.15)] max-w-[90vw] sm:max-w-md focus-visible:outline-none">
        <DialogTitle className="sr-only">Streak Goal Completed Celebration</DialogTitle>
        <div className="relative p-8 flex flex-col items-center text-center overflow-hidden">
          
          {/* Ambient Glowing Background */}
          <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 via-transparent to-transparent opacity-70 pointer-events-none" />

          {/* Floating Gold Sparkle Particles */}
          <AnimatePresence>
            {show && sparkles.map((sp) => (
              <motion.div
                key={sp.id}
                initial={{ opacity: 0, scale: 0, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, sp.scale, sp.scale * 1.2, 0],
                  rotate: [0, 180, 360],
                  y: [0, -100 - Math.random() * 50],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2.5 + Math.random() * 1.5,
                  delay: sp.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute pointer-events-none"
                style={{
                  left: `${sp.x}%`,
                  bottom: `${sp.y}%`,
                  zIndex: 1,
                }}
              >
                <Sparkles
                  size={12 + Math.random() * 12}
                  style={{ color: sp.color, fill: sp.color }}
                  className="opacity-70 blur-[0.5px]"
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Main Visual Animation: Trophy + Fire */}
          <div className="relative z-10 my-6 flex items-center justify-center">
            {/* Glowing Aura */}
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute w-28 h-28 bg-gradient-to-tr from-amber-500/20 to-yellow-400/20 rounded-full blur-xl"
            />

            {/* Orbiting Stars */}
            {Array.from({ length: 3 }).map((_, idx) => (
              <motion.div
                key={idx}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 6 + idx * 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute w-36 h-36 border border-dashed border-amber-500/10 rounded-full pointer-events-none"
              >
                <motion.div
                  className="absolute"
                  style={{
                    top: "0%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <Sparkles size={14} className="text-amber-400/80 fill-amber-400/30" />
                </motion.div>
              </motion.div>
            ))}

            {/* Central Animated Trophy */}
            <motion.div
              initial={{ scale: 0.3, rotate: -25, y: 50, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 10,
                delay: 0.1,
              }}
              className="relative p-6 rounded-full bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-500/30 shadow-inner flex items-center justify-center"
            >
              <motion.div
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative"
              >
                <Trophy size={64} className="text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)] fill-amber-400/10" />
                <motion.div
                  className="absolute -top-2 -right-2"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Flame size={24} className="text-orange-500 fill-orange-500/80" />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* Congratulations Copy */}
          <div className="relative z-10 space-y-3 px-2">
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-block text-[11px] font-bold tracking-[0.2em] uppercase text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20"
            >
              Milestone Unlocked
            </motion.span>
            
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-serif font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/80 bg-clip-text text-transparent"
            >
              Streak Goal Achieved!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground text-sm leading-relaxed max-w-[280px] mx-auto font-sans"
            >
              Spectacular job! You have fully completed all routines and maintained a magnificent{" "}
              <span className="font-bold text-amber-400 text-base">{streakGoal}-day streak</span>.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-[12px] italic text-muted-foreground/60 pt-1"
            >
              "Consistency is the sparkling spark of success."
            </motion.p>
          </div>

          {/* Interactive Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative z-10 w-full mt-8"
          >
            <Button
              onClick={() => {
                tapHaptic();
                onClose();
              }}
              className="w-full h-13 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black border border-amber-400/40 shadow-[0_4px_20px_rgba(251,191,36,0.35)] transition-all duration-300 hover:shadow-[0_6px_25px_rgba(251,191,36,0.45)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Awesome! 🌟
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
