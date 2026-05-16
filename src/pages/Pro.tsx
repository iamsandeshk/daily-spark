import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { tapHaptic, successHaptic } from "@/lib/haptics";
import { isPro, setPro } from "@/lib/pro";

type Plan = {
  id: "monthly" | "yearly" | "lifetime";
  name: string;
  price: string;
  period: string;
  badge?: string;
  sub?: string;
};

const PLANS: Plan[] = [
  { id: "monthly",  name: "Monthly",  price: "$2.99",  period: "/ month", sub: "Billed every month" },
  { id: "yearly",   name: "Yearly",   price: "$19.99", period: "/ year",  sub: "Save 44% vs monthly", badge: "Most popular" },
  { id: "lifetime", name: "Lifetime", price: "$49.99", period: "one-time", sub: "Pay once, yours forever" },
];

const FEATURES = [
  "Unlock all color themes (Orange, Green, Blue, Purple…)",
  "AMOLED black + custom accent colors",
  "Unlimited routines and sections",
  "Advanced weekly & monthly insights",
  "Cloud backup & cross-device sync",
  "Smart reminders based on your habits",
  "Custom app icons",
  "Widgets for home screen",
  "Export to PDF reports",
  "Priority support",
];

const Pro = () => {
  const navigate = useNavigate();
  const [pro, setProState] = useState(isPro());
  const [selected, setSelected] = useState<Plan["id"]>("yearly");

  useEffect(() => {
    const onUpdate = () => setProState(isPro());
    window.addEventListener("pro:updated", onUpdate);
    return () => window.removeEventListener("pro:updated", onUpdate);
  }, []);

  const togglePro = () => {
    const next = !pro;
    setPro(next);
    setProState(next);
    if (next) successHaptic(); else tapHaptic();
  };

  return (
    <div className="min-h-full bg-background pb-20 no-select">
      <header className="sticky top-0 z-30 bg-background safe-top px-5 pb-3 pt-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-serif font-bold">Daily Routines Pro</h1>
      </header>

      <main className="px-5">
        {/* Hero */}
        <div className="mt-2 rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent p-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-black uppercase tracking-wider text-accent-foreground">
            <Crown size={12} /> Pro
          </div>
          <h2 className="mt-3 text-3xl font-serif font-bold leading-tight">
            Build your perfect day, beautifully.
          </h2>
          <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
            Unlock every theme, advanced insights, cloud sync, and more.
          </p>
        </div>

        {/* Dev toggle */}
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3.5 flex items-center gap-3">
          <Sparkles size={18} className="text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold">Pro features (dev toggle)</div>
            <div className="text-[12px] text-muted-foreground">Temporary switch — remove before launch</div>
          </div>
          <button
            onClick={togglePro}
            className={cn(
              "h-7 px-3 rounded-full text-[12px] font-bold transition-colors",
              pro ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground border border-border"
            )}
          >
            {pro ? "ON" : "OFF"}
          </button>
        </div>

        {/* Plans */}
        <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1 mt-7 mb-2.5">
          Choose your plan
        </h3>
        <div className="space-y-2.5">
          {PLANS.map((p) => {
            const active = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => { setSelected(p.id); tapHaptic(); }}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition-all flex items-center gap-3",
                  active ? "border-accent bg-accent/5 shadow-sm" : "border-border bg-card hover:bg-muted/60"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center",
                  active ? "border-accent bg-accent" : "border-border"
                )}>
                  {active && <Check size={12} className="text-accent-foreground" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold">{p.name}</span>
                    {p.badge && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  {p.sub && <div className="text-[12px] text-muted-foreground mt-0.5">{p.sub}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[17px] font-bold tabular-nums">{p.price}</div>
                  <div className="text-[11px] text-muted-foreground">{p.period}</div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => { tapHaptic(); }}
          className="mt-5 w-full rounded-2xl bg-foreground text-background py-4 text-[15px] font-bold shadow-sm hover:opacity-90 transition-opacity"
        >
          Continue — {PLANS.find((p) => p.id === selected)?.price}
        </button>
        <p className="text-center text-[11px] text-muted-foreground mt-2.5">
          Cancel anytime. No hidden fees.
        </p>

        {/* Features */}
        <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1 mt-7 mb-2.5">
          What's included
        </h3>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-start gap-3 px-4 py-3">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                <Check size={12} className="text-accent" strokeWidth={3} />
              </div>
              <div className="text-[14px] leading-relaxed">{f}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Pro;
