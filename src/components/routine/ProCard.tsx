import React, { useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isPro } from "@/lib/pro";
import { tapHaptic } from "@/lib/haptics";

export const ProCard: React.FC = () => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("pro_card_dismissed") === "1";
  });

  if (isPro() || dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    tapHaptic();
    setDismissed(true);
    localStorage.setItem("pro_card_dismissed", "1");
  };

  return (
    <div
      onClick={() => {
        tapHaptic();
        navigate("/settings/pro");
      }}
      className="relative px-6 py-4.5 rounded-[28px] bg-[#161618] border border-white/[0.08] cursor-pointer hover:border-white/15 transition-all duration-200 select-none overflow-hidden"
    >
      {/* Top row: Branding + PRO badge + Close button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-white/60">
            Daily Routines
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider">
            PRO
          </span>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss Pro card"
          className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center text-white/50 hover:text-white active:scale-90 transition-all shrink-0"
        >
          <X size={14} strokeWidth={2.2} />
        </button>
      </div>

      {/* Main headline: comfortable typography */}
      <h3 className="text-[17px] font-semibold text-white mt-1.5 tracking-tight">
        Unlock Your Full Potential
      </h3>
    </div>
  );
};
