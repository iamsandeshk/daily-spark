import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, CalendarDays, Archive, ArchiveRestore, RotateCcw, RefreshCw, Trash2 } from "lucide-react";
import { useRoutines } from "@/hooks/useRoutines";
import { ClockPickerDialog } from "@/components/ClockPickerDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { tapHaptic, successHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("rounded-2xl border border-border bg-card overflow-hidden", className)}>{children}</div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1 mt-7 mb-2.5">
    {children}
  </h3>
);

const RoutineSettings = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const r = useRoutines();
  const routine = useMemo(() => r.state.routines.find((x) => x.id === id), [r.state.routines, id]);

  const [clockOpen, setClockOpen] = useState(false);

  if (!routine) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Routine not found.</p>
      </div>
    );
  }

  const globalReset = r.state.settings ?? {};
  const hasOwnReset = routine.resetHour !== undefined || routine.resetMinute !== undefined;
  const effHour = routine.resetHour ?? globalReset.resetHour ?? 0;
  const effMinute = routine.resetMinute ?? (globalReset as any).resetMinute ?? 0;

  const formatTime = (h: number, m = 0) => {
    const am = h < 12;
    const hh = h % 12 === 0 ? 12 : h % 12;
    const mm = m.toString().padStart(2, "0");
    return `${hh}:${mm} ${am ? "AM" : "PM"}`;
  };

  return (
    <div className="min-h-full bg-background pb-20">
      <header className="safe-top px-5 pb-3 pt-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-serif font-bold truncate flex items-center gap-2">
            <span>{routine.emoji}</span>
            <span className="truncate">{routine.title}</span>
          </h1>
          <p className="text-xs text-muted-foreground">Routine settings</p>
        </div>
      </header>

      <main className="px-5">
        <SectionLabel>Reset</SectionLabel>
        <Card>
          <button
            onClick={() => setClockOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/60 transition-colors"
          >
            <Clock size={18} className="shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-medium">Reset time</div>
              <div className="text-[12px] text-muted-foreground truncate">
                {hasOwnReset
                  ? `Tasks reset at ${formatTime(effHour, effMinute)}`
                  : `Using app default (${formatTime(effHour, effMinute)})`}
              </div>
            </div>
            <span className="text-[13px] text-muted-foreground tabular-nums">
              {formatTime(effHour, effMinute)}
            </span>
          </button>
          {hasOwnReset && (
            <div className="border-t border-border">
              <button
                onClick={() => {
                  r.updateRoutine(routine.id, {
                    resetHour: undefined,
                    resetMinute: undefined,
                  });
                  tapHaptic();
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-left text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <RotateCcw size={14} /> Use app default reset time
              </button>
            </div>
          )}
          <div className="border-t border-border flex items-center gap-3 px-4 py-3.5">
            <RefreshCw size={18} className="shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-medium">Reset checked tasks</div>
              <div className="text-[12px] text-muted-foreground">
                {routine.disableDailyReset
                  ? "Tasks stay checked until you uncheck them"
                  : "Tasks reset every day at the reset time"}
              </div>
            </div>
            <Switch
              checked={!routine.disableDailyReset}
              onCheckedChange={(v) => {
                r.updateRoutine(routine.id, { disableDailyReset: !v });
                tapHaptic();
              }}
            />
          </div>
        </Card>

        <SectionLabel>Schedule</SectionLabel>
        <Card>
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
            <CalendarDays size={18} className="shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-medium">Start date</div>
              <div className="text-[12px] text-muted-foreground">When the routine becomes active</div>
            </div>
            <Input
              type="date"
              value={routine.startDate ?? ""}
              onChange={(e) => r.updateRoutine(routine.id, { startDate: e.target.value || undefined })}
              className="w-[140px] h-9 text-[13px]"
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <CalendarDays size={18} className="shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-medium">End date</div>
              <div className="text-[12px] text-muted-foreground">
                {routine.endDate ? "Auto-archives after this date" : "Never ending"}
              </div>
            </div>
            <Input
              type="date"
              value={routine.endDate ?? ""}
              onChange={(e) => r.updateRoutine(routine.id, { endDate: e.target.value || undefined })}
              className="w-[140px] h-9 text-[13px]"
            />
          </div>
        </Card>
        <p className="text-[12px] text-muted-foreground/80 px-2 mt-2 leading-relaxed">
          Routines are hidden from your home before the start date and after the end date. Leave dates blank to
          keep the routine active permanently.
        </p>

        <SectionLabel>Archive</SectionLabel>
        <Card>
          <button
            onClick={() => {
              r.updateRoutine(routine.id, { archived: !routine.archived });
              successHaptic();
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/60 transition-colors"
          >
            {routine.archived ? (
              <ArchiveRestore size={18} className="shrink-0 text-muted-foreground" />
            ) : (
              <Archive size={18} className="shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-medium">
                {routine.archived ? "Unarchive routine" : "Archive routine"}
              </div>
              <div className="text-[12px] text-muted-foreground">
                {routine.archived
                  ? "Bring this routine back to home"
                  : "Hide from home without losing data"}
              </div>
            </div>
          </button>
        </Card>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={() => {
              successHaptic();
              navigate(-1);
            }}
            className="rounded-2xl h-11 px-6 font-bold"
          >
            Done
          </Button>
        </div>
      </main>

      <ClockPickerDialog
        open={clockOpen}
        onOpenChange={setClockOpen}
        initialHour={effHour}
        initialMinute={effMinute}
        onConfirm={(h, m) => {
          r.updateRoutine(routine.id, { resetHour: h, resetMinute: m });
          tapHaptic();
        }}
      />
    </div>
  );
};

export default RoutineSettings;
