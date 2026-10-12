import React, { useMemo } from "react";
import { Play, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Routine, RoutineState } from "@/lib/routine-types";
import { todayKey } from "@/lib/storage";
import { getRoutineColor } from "@/lib/routine-colors";
import { RoutineIcon } from "./RoutineIcon";
import { tapHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type Props = {
  routines: Routine[];
  state: RoutineState;
};

export const HomeWeekView: React.FC<Props> = ({ routines, state }) => {
  const navigate = useNavigate();
  const today = todayKey();
  const startOfWeek = (state.settings?.startOfWeek ?? 1) as 0 | 1;

  // Compute 7 days of the current week (e.g. Mon-Sun or Sun-Sat)
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const diff = (currentDayOfWeek - startOfWeek + 7) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - diff);

    const weekdaysLetters = ["S", "M", "T", "W", "T", "F", "S"];
    const arr: Array<{
      key: string;
      date: Date;
      letter: string;
      dayNum: number;
      isToday: boolean;
      isFuture: boolean;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const k = todayKey(d);
      arr.push({
        key: k,
        date: d,
        letter: weekdaysLetters[d.getDay()],
        dayNum: d.getDate(),
        isToday: k === today,
        isFuture: k > today,
      });
    }
    return arr;
  }, [startOfWeek, today]);

  return (
    <div className="space-y-3.5 select-none">
      {/* Top 7-Day Header Strip matching Reference 1 */}
      <div className="rounded-2xl border border-white/10 bg-[#161618] px-4 py-3 flex items-center justify-between shadow-sm">
        {weekDays.map((d) => (
          <div
            key={d.key}
            className="flex flex-col items-center justify-center min-w-[36px]"
          >
            <span
              className={cn(
                "text-[11px] font-bold tracking-wider",
                d.isToday ? "text-white" : "text-white/40",
              )}
            >
              {d.letter}
            </span>
            <span
              className={cn(
                "text-[13px] font-semibold tracking-tight mt-0.5",
                d.isToday ? "text-white font-bold" : "text-white/70",
              )}
            >
              {d.dayNum}
            </span>
            {d.isToday && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
            )}
          </div>
        ))}
      </div>

      {/* Routine Cards in Week View */}
      {routines.map((routine) => {
        const color = getRoutineColor(routine);
        const allBlocks = (routine.blocks ?? []).filter(
          (b) => (b.type === "checkbox" || b.type === "timer") && b.text?.trim(),
        );
        const doneBlocks = allBlocks.filter((b) => b.checked).length;
        const totalBlocks = allBlocks.length;

        // Subtitle logic matching Reference 1 (e.g. "0:00 / 10 min" or "0 / 3 times")
        const timerBlock = (routine.blocks ?? []).find(
          (b) => b.type === "timer" && (b.durationSeconds ?? 0) > 0,
        );
        let subtitle = "";
        if (timerBlock) {
          const totalMin = Math.round((timerBlock.durationSeconds ?? 600) / 60);
          subtitle = `0:00 / ${totalMin} min`;
        } else if (totalBlocks > 0) {
          subtitle = `${doneBlocks} / ${totalBlocks} completed`;
        } else {
          subtitle = "Daily routine";
        }

        const localizedGlow = {
          background: `radial-gradient(circle at 6% 30%, ${color.glow || "rgba(168, 85, 247, 0.12)"} 0%, transparent 45%), #161618`,
        };

        return (
          <div
            key={routine.id}
            onClick={() => {
              tapHaptic();
              navigate(`/routine/${routine.id}`);
            }}
            style={localizedGlow}
            className="rounded-[28px] border border-white/[0.08] px-5 py-4.5 cursor-pointer hover:border-white/15 transition-all duration-200"
          >
            {/* Upper Section: Icon + Title + Action */}
            <div className="flex items-center justify-between pb-3.5">
              <div className="flex items-center gap-4 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
                  <RoutineIcon routine={routine} size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[18px] font-semibold text-white tracking-tight truncate">
                      {routine.title}
                    </span>
                    {routine.streakCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-orange-400 shrink-0">
                        <span>🔥</span>
                        <span>{routine.streakCount}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-white/50 mt-0.5 truncate font-normal">
                    {subtitle}
                  </p>
                </div>
              </div>

              {/* Right Action Control (Play / Plus) */}
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    tapHaptic();
                    navigate(`/routine/${routine.id}`);
                  }}
                  aria-label="Open routine"
                  className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/15 active:scale-90 transition-all"
                >
                  {timerBlock ? (
                    <Play size={13} fill="currentColor" className="ml-0.5" />
                  ) : (
                    <Plus size={15} strokeWidth={2.4} />
                  )}
                </button>
              </div>
            </div>

            {/* Lower Section: 7 Evenly Spaced Day Dots matching Reference 1 */}
            <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between px-2">
              {weekDays.map((d) => {
                let isDone = false;
                let isPartial = false;

                if (d.isToday) {
                  isDone =
                    routine.isCompleted ||
                    (totalBlocks > 0 && doneBlocks === totalBlocks);
                  isPartial = !isDone && doneBlocks > 0 && doneBlocks < totalBlocks;
                } else if (!d.isFuture) {
                  const dayRecord = state.history[d.key];
                  if (dayRecord) {
                    const snap = dayRecord.snapshot?.[routine.id];
                    const snapBlocks = (snap?.blocks ?? []).filter(
                      (b) =>
                        (b.type === "checkbox" || b.type === "timer") &&
                        b.text?.trim(),
                    );
                    const snapDone = snapBlocks.filter((b) => b.checked).length;
                    const inCompletedList = (
                      dayRecord.completedRoutineIds ?? []
                    ).includes(routine.id);

                    isDone =
                      inCompletedList ||
                      (snapBlocks.length > 0 && snapDone === snapBlocks.length);
                    isPartial =
                      !isDone && snapBlocks.length > 0 && snapDone > 0;
                  }
                }

                return (
                  <div
                    key={d.key}
                    className="w-8 flex items-center justify-center"
                  >
                    {d.isToday ? (
                      /* Today Indicator: Dashed circular ring around the dot (Reference 1) */
                      <div className="relative w-6 h-6 flex items-center justify-center">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center transition-all",
                            isDone
                              ? "border-[#22c55e] bg-[#22c55e]/20"
                              : "border-white/35",
                          )}
                        >
                          {isDone ? (
                            <span
                              className="w-3.5 h-3.5 rounded-full"
                              style={{ backgroundColor: color.hex }}
                            />
                          ) : isPartial ? (
                            <span
                              className="w-2.5 h-2.5 rounded-full opacity-70"
                              style={{ backgroundColor: color.hex }}
                            />
                          ) : null}
                        </div>
                      </div>
                    ) : isDone ? (
                      /* Completed Day: Solid filled circle in routine's accent color (Reference 1) */
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: color.hex }}
                      />
                    ) : isPartial ? (
                      /* Partial completion: half/semi-ring in accent color */
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: color.hex }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: color.hex }}
                        />
                      </div>
                    ) : d.isFuture ? (
                      /* Future Day: Faint dark dot */
                      <div className="w-4 h-4 rounded-full bg-white/[0.08]" />
                    ) : (
                      /* Incomplete Past Day: Dark grey dot (Reference 1) */
                      <div className="w-4 h-4 rounded-full bg-white/[0.14]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
