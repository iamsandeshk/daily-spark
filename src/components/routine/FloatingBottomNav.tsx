import React from "react";
import { BarChart2, Sun, CalendarDays, ChevronsUpDown, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { tapHaptic } from "@/lib/haptics";

type Props = {
  viewMode: "today" | "week";
  onViewModeToggle: () => void;
  onOpenMenu: () => void;
};

export const FloatingBottomNav: React.FC<Props> = ({
  viewMode,
  onViewModeToggle,
  onOpenMenu,
}) => {
  const navigate = useNavigate();

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-6 left-0 right-0 z-40 flex items-center justify-center gap-3 px-6 pointer-events-none select-none"
      style={{ marginBottom: "calc(env(safe-area-inset-bottom, 0px) + 6px)" }}
    >
      {/* Left button: Stats / Insights */}
      <button
        type="button"
        onClick={() => {
          tapHaptic();
          navigate("/insights");
        }}
        aria-label="View Insights and Statistics"
        className="pointer-events-auto w-12 h-12 rounded-full bg-[#1c1c1f] border border-white/10 flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
      >
        <BarChart2 size={20} strokeWidth={2.2} />
      </button>

      {/* Center pill: Functional View switcher (Today / Week) */}
      <button
        type="button"
        onClick={() => {
          tapHaptic();
          onViewModeToggle();
        }}
        aria-label={`Current view is ${viewMode}. Tap to toggle between Today and Week view.`}
        className="pointer-events-auto h-12 px-6 rounded-full bg-[#1c1c1f] border border-white/10 flex items-center justify-center gap-2.5 text-white active:scale-95 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.5)] cursor-pointer"
      >
        {viewMode === "today" ? (
          <>
            <Sun size={17} strokeWidth={2.2} className="text-white/85 shrink-0" />
            <span className="text-[15px] font-semibold text-white tracking-tight">Today</span>
            <ChevronsUpDown size={14} className="text-white/40 shrink-0" />
          </>
        ) : (
          <>
            <CalendarDays size={17} strokeWidth={2.2} className="text-white/85 shrink-0" />
            <span className="text-[15px] font-semibold text-white tracking-tight">Week</span>
            <ChevronsUpDown size={14} className="text-white/40 shrink-0" />
          </>
        )}
      </button>

      {/* Right button: Routines List / Menu / Options */}
      <button
        type="button"
        onClick={() => {
          tapHaptic();
          onOpenMenu();
        }}
        aria-label="Routines menu and options"
        className="pointer-events-auto w-12 h-12 rounded-full bg-[#1c1c1f] border border-white/10 flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
      >
        <List size={20} strokeWidth={2.2} />
      </button>
    </nav>
  );
};
