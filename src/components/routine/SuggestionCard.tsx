import React, { useState } from "react";
import { X } from "lucide-react";
import { tapHaptic } from "@/lib/haptics";

type Props = {
  onAddRoutine: () => void;
};

export const SuggestionCard: React.FC<Props> = ({ onAddRoutine }) => {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("suggestion_card_dismissed") === "1";
  });

  if (dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    tapHaptic();
    setDismissed(true);
    localStorage.setItem("suggestion_card_dismissed", "1");
  };

  return (
    <div
      onClick={() => {
        tapHaptic();
        onAddRoutine();
      }}
      className="relative flex items-center justify-between px-6 py-4.5 rounded-[28px] bg-[#161618] border border-white/[0.08] cursor-pointer hover:border-white/15 transition-all duration-200 select-none overflow-hidden"
    >
      {/* Comfortable two-line text layout */}
      <div className="min-w-0 pr-4">
        <h3 className="text-[17px] font-semibold text-white tracking-tight">
          You're doing great
        </h3>
        <p className="text-[13px] text-white/50 mt-1 font-normal">
          Add one more routine
        </p>
      </div>

      {/* Small, clean circular dismiss button on the right */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss suggestion"
        className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center text-white/50 hover:text-white active:scale-90 transition-all shrink-0"
      >
        <X size={14} strokeWidth={2.2} />
      </button>
    </div>
  );
};
