import React from "react";
import { SlidersHorizontal, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { tapHaptic } from "@/lib/haptics";

type Props = {
  viewMode: "today" | "week";
  uncompletedCount: number;
  onAddRoutine: () => void;
};

export const HomeHeader: React.FC<Props> = ({
  viewMode,
  uncompletedCount,
  onAddRoutine,
}) => {
  const navigate = useNavigate();

  // Format today's date like "Today, 12 Oct" (Reference 2 & 3)
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleDateString(undefined, { month: "short" });
  const dateTitle = `Today, ${day} ${month}`;

  return (
    <header
      className="sticky top-0 z-30 px-5 pb-4 pt-3 flex items-center justify-between pointer-events-auto bg-black/90 backdrop-blur-md"
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)",
      }}
    >
      {/* Top-left: Circular Settings button (Fixed responsibility: Open Settings) */}
      <button
        type="button"
        onClick={() => {
          tapHaptic();
          navigate("/settings");
        }}
        aria-label="Open settings"
        className="w-11 h-11 rounded-full bg-[#18181b] border border-white/10 flex items-center justify-center text-white/90 hover:text-white hover:bg-[#222226] active:scale-95 transition-all shadow-sm"
      >
        <SlidersHorizontal size={18} strokeWidth={2.2} />
      </button>

      {/* Center: Truly centered title and optional subtle separated indicator */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center select-none pointer-events-none">
        {viewMode === "today" ? (
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-semibold text-white tracking-tight">
              {dateTitle}
            </h1>
            {uncompletedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/[0.08] text-[11px] font-medium text-white/50 tabular-nums">
                {uncompletedCount}
              </span>
            )}
          </div>
        ) : (
          <h1 className="text-[18px] font-semibold text-white tracking-tight">
            Week
          </h1>
        )}
      </div>

      {/* Top-right: Circular Add button (Fixed responsibility: Create new routine) */}
      <button
        type="button"
        onClick={() => {
          tapHaptic();
          onAddRoutine();
        }}
        aria-label="Create new routine"
        className="w-11 h-11 rounded-full bg-[#18181b] border border-white/10 flex items-center justify-center text-white/90 hover:text-white hover:bg-[#222226] active:scale-95 transition-all shadow-sm"
      >
        <Plus size={20} strokeWidth={2.4} />
      </button>
    </header>
  );
};
