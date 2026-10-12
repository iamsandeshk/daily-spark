import React from "react";
import {
  Settings,
  Calendar,
  Layers,
  Archive,
  ArrowUpDown,
  Sparkles,
  ChevronRight,
  Crown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { isPro } from "@/lib/pro";
import { tapHaptic } from "@/lib/haptics";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleReorder: () => void;
  reorderActive: boolean;
};

export const HomeMenuSheet: React.FC<Props> = ({
  open,
  onOpenChange,
  onToggleReorder,
  reorderActive,
}) => {
  const navigate = useNavigate();
  const pro = isPro();

  const handleAction = (cb: () => void) => {
    tapHaptic();
    onOpenChange(false);
    cb();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-[#141417] border-white/10 text-white max-w-lg mx-auto pb-8">
        <DrawerHeader className="text-left pb-2">
          <DrawerTitle className="text-lg font-bold text-white tracking-tight">
            Menu & Options
          </DrawerTitle>
          <DrawerDescription className="text-xs text-white/50">
            Manage your daily routines and application settings
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-2 space-y-1.5">
          {/* Reorder Routines */}
          <button
            type="button"
            onClick={() => {
              handleAction(() => onToggleReorder());
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80">
                <ArrowUpDown size={18} />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">
                  {reorderActive ? "Done Reordering" : "Reorder Routines"}
                </span>
                <span className="text-xs text-white/40 block">
                  Drag to rearrange routine order
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="text-white/40" />
          </button>

          {/* History / Calendar */}
          <button
            type="button"
            onClick={() => handleAction(() => navigate("/history"))}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80">
                <Calendar size={18} />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">
                  History & Calendar
                </span>
                <span className="text-xs text-white/40 block">
                  View past completion logs
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="text-white/40" />
          </button>

          {/* Templates */}
          <button
            type="button"
            onClick={() => handleAction(() => navigate("/settings/templates"))}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80">
                <Layers size={18} />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">
                  Routine Templates
                </span>
                <span className="text-xs text-white/40 block">
                  Explore pre-built routines
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="text-white/40" />
          </button>

          {/* Archived */}
          <button
            type="button"
            onClick={() => handleAction(() => navigate("/settings/archived"))}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80">
                <Archive size={18} />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">
                  Archived Routines
                </span>
                <span className="text-xs text-white/40 block">
                  Restore hidden routines
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="text-white/40" />
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => handleAction(() => navigate("/settings"))}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80">
                <Settings size={18} />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">
                  Settings & Preferences
                </span>
                <span className="text-xs text-white/40 block">
                  Theme, notifications, and reset schedule
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="text-white/40" />
          </button>

          {/* Pro Upgrade if not Pro */}
          {!pro && (
            <button
              type="button"
              onClick={() => handleAction(() => navigate("/settings/pro"))}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 active:scale-[0.98] transition-all text-left mt-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Crown size={18} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-amber-300 block">
                    Daily Routines PRO
                  </span>
                  <span className="text-xs text-amber-400/60 block">
                    Unlimited routines, icons & widgets
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-amber-400/50" />
            </button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
