import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  valueSeconds: number;
  onConfirm: (seconds: number) => void;
};

const PRESETS = [
  { label: "1 min", s: 60 },
  { label: "5 min", s: 300 },
  { label: "10 min", s: 600 },
  { label: "15 min", s: 900 },
  { label: "25 min", s: 1500 },
  { label: "45 min", s: 2700 },
  { label: "1 hr", s: 3600 },
  { label: "2 hr", s: 7200 },
];

export const DurationPicker = ({ open, onOpenChange, valueSeconds, onConfirm }: Props) => {
  const [h, setH] = useState(0);
  const [m, setM] = useState(0);
  const [s, setS] = useState(0);

  useEffect(() => {
    if (!open) return;
    const total = Math.max(0, Math.floor(valueSeconds || 0));
    setH(Math.floor(total / 3600));
    setM(Math.floor((total % 3600) / 60));
    setS(total % 60);
  }, [open, valueSeconds]);

  const total = h * 3600 + m * 60 + s;

  const submit = () => {
    onConfirm(Math.max(1, total));
    onOpenChange(false);
  };

  const Field = ({ label, value, set, max }: { label: string; value: number; set: (n: number) => void; max: number }) => (
    <div className="flex flex-col items-center flex-1">
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Math.max(0, Math.min(max, parseInt(e.target.value || "0", 10)));
          set(isNaN(n) ? 0 : n);
        }}
        className="w-full text-center bg-muted/40 rounded-2xl py-4 text-3xl font-bold tabular-nums outline-none border border-border focus:border-accent transition-colors"
      />
      <span className="mt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[28px] p-7 gap-5 max-w-[90vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif font-bold text-left">Set duration</DialogTitle>
        </DialogHeader>

        <div className="flex items-end gap-3">
          <Field label="Hours" value={h} set={setH} max={23} />
          <span className="pb-8 text-2xl font-bold text-muted-foreground">:</span>
          <Field label="Minutes" value={m} set={setM} max={59} />
          <span className="pb-8 text-2xl font-bold text-muted-foreground">:</span>
          <Field label="Seconds" value={s} set={setS} max={59} />
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.s}
              type="button"
              onClick={() => {
                setH(Math.floor(p.s / 3600));
                setM(Math.floor((p.s % 3600) / 60));
                setS(p.s % 60);
              }}
              className={cn(
                "px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors",
                total === p.s
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-muted/40 text-muted-foreground border-border hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <DialogFooter className="flex flex-row gap-3 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-2xl h-12 font-bold border-border/60"
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={total < 1} className="flex-1 rounded-2xl h-12 font-bold">
            Set
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
