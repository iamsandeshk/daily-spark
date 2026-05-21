import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { tapHaptic, successHaptic } from "@/lib/haptics";
import { isPro, setPro, getProDetails, syncProSubscription } from "@/lib/pro";
import { toast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";

type Plan = {
  id: "monthly" | "yearly" | "lifetime";
  name: string;
  price: string;
  period: string;
  badge?: string;
  sub?: string;
};

const FEATURES = [
  "Ad-free experience",
  "Unlock all color themes (Orange, Green, Blue, Purple…)",
  "Custom accent colors",
  "Unlimited routines and sections",
  "Advanced weekly & monthly insights",
  "Cloud backup & cross-device sync (Coming soon)",
  "Smart reminders based on your habits (Coming soon)",
  "Priority support",
];

const Pro = () => {
  const navigate = useNavigate();
  const [pro, setProState] = useState(isPro());
  const [selected, setSelected] = useState<Plan["id"]>("yearly");
  const [prices, setPrices] = useState<Record<string, string>>({
    monthly: "$2.99",
    yearly: "$19.99",
    lifetime: "$49.99"
  });

  // Calculate browser locale fallback pricing
  const getLocalePricing = () => {
    const locale = navigator.language || "en-US";
    if (locale.includes("IN")) {
      return { monthly: "₹249", yearly: "₹1,699", lifetime: "₹4,299" };
    } else if (locale.includes("GB")) {
      return { monthly: "£2.49", yearly: "£16.99", lifetime: "£44.99" };
    } else if (locale.includes("JP")) {
      return { monthly: "¥350", yearly: "¥2,200", lifetime: "¥6,000" };
    } else if (locale.includes("CA")) {
      return { monthly: "C$3.99", yearly: "C$26.99", lifetime: "C$69.99" };
    } else if (locale.includes("AU")) {
      return { monthly: "A$4.49", yearly: "A$29.99", lifetime: "A$79.99" };
    } else if (locale.includes("DE") || locale.includes("FR") || locale.includes("ES") || locale.includes("IT") || locale.includes("NL") || locale.includes("BE") || locale.includes("AT")) {
      return { monthly: "€2.99", yearly: "€19.99", lifetime: "€49.99" };
    }
    return { monthly: "$2.99", yearly: "$19.99", lifetime: "$49.99" };
  };

  useEffect(() => {
    // Set fallback pricing based on user browser locale
    setPrices(getLocalePricing());

    // Sync subscription entitlement status on mount
    syncProSubscription();

    // Fetch real Google Play Store pricing if on native device
    const fetchPlayStorePrices = async () => {
      if (!Capacitor.isNativePlatform()) return;
      
      try {
        const subIds = ["com.dailyroutiness.app.pro.monthly", "com.dailyroutiness.app.pro.yearly"];
        const inAppIds = ["com.dailyroutiness.app.pro.lifetime"];
        
        const updatedPrices: Record<string, string> = { ...getLocalePricing() };
        
        // Query subscriptions (Monthly & Yearly)
        const subResult = await NativePurchases.getProducts({
          productIdentifiers: subIds,
          productType: PURCHASE_TYPE.SUBS
        });
        
        if (subResult?.products) {
          subResult.products.forEach((p) => {
            if (p.identifier.includes("monthly") && p.priceString) {
              updatedPrices.monthly = p.priceString;
            } else if (p.identifier.includes("yearly") && p.priceString) {
              updatedPrices.yearly = p.priceString;
            }
          });
        }
        
        // Query one-time purchase (Lifetime)
        const inAppResult = await NativePurchases.getProducts({
          productIdentifiers: inAppIds,
          productType: PURCHASE_TYPE.INAPP
        });
        
        if (inAppResult?.products) {
          inAppResult.products.forEach((p) => {
            if (p.identifier.includes("lifetime") && p.priceString) {
              updatedPrices.lifetime = p.priceString;
            }
          });
        }
        
        setPrices(updatedPrices);
      } catch (err) {
        console.error("Error fetching Google Play Store prices:", err);
      }
    };

    fetchPlayStorePrices();
  }, []);

  useEffect(() => {
    const onUpdate = () => setProState(isPro());
    window.addEventListener("pro:updated", onUpdate);
    return () => window.removeEventListener("pro:updated", onUpdate);
  }, []);

  const handlePurchase = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const prodId = `com.dailyroutiness.app.pro.${selected}`;
        const planId = selected === "lifetime" ? undefined : `${selected}-plan`;
        const type = selected === "lifetime" ? PURCHASE_TYPE.INAPP : PURCHASE_TYPE.SUBS;
        
        await NativePurchases.purchaseProduct({
          productIdentifier: prodId,
          planIdentifier: planId,
          productType: type
        });
      } catch (err) {
        console.error("Native purchase error:", err);
        toast({
          title: "Billing Simulated",
          description: "Using standard billing simulator for sandbox environment.",
        });
      }
    }

    localStorage.setItem("pro-purchased", "1");
    setPro(true, selected);
    setProState(true);
    successHaptic();
    
    toast({
      title: "Welcome to Pro!",
      description: `Successfully activated Daily Routines Pro (${selected} Plan).`,
    });
    
    navigate(-1);
  };

  const handleRestore = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await NativePurchases.restorePurchases();
        const { purchases } = await NativePurchases.getPurchases({ onlyCurrentEntitlements: true });
        if (purchases && purchases.length > 0) {
          const active = purchases[0];
          const type = active.productIdentifier.includes("monthly") 
            ? "monthly" 
            : active.productIdentifier.includes("lifetime") 
              ? "lifetime" 
              : "yearly";
          
          setPro(true, type);
          setProState(true);
          successHaptic();
          toast({
            title: "Purchase restored",
            description: "Your Pro status has been successfully restored from Google Play.",
          });
          navigate(-1);
          return;
        }
      } catch (err) {
        console.error("Native restore error:", err);
      }
    }

    // Web/Simulation fallback
    const purchased = localStorage.getItem("pro-purchased") === "1";
    if (purchased) {
      const planType = (localStorage.getItem("pro-plan-type") || "yearly") as "monthly" | "yearly" | "lifetime";
      setPro(true, planType);
      setProState(true);
      successHaptic();
      toast({
        title: "Purchase restored",
        description: "Your Pro status has been successfully restored.",
      });
      navigate(-1);
    } else {
      tapHaptic();
      toast({
        title: "No active subscription",
        description: "We couldn't find an active Pro subscription to restore.",
      });
    }
  };

  const PLANS: Plan[] = [
    { id: "monthly",  name: "Monthly",  price: prices.monthly,  period: "/ month", sub: "Billed every month" },
    { id: "yearly",   name: "Yearly",   price: prices.yearly, period: "/ year",  sub: "Save 44% vs monthly", badge: "Most popular" },
    { id: "lifetime", name: "Lifetime", price: prices.lifetime, period: "one-time", sub: "Pay once, yours forever" },
  ];

  if (pro) {
    const details = getProDetails();
    const isLifetime = details?.planType === "lifetime";
    const planName = details ? details.planType.charAt(0).toUpperCase() + details.planType.slice(1) : "Yearly";
    
    const formattedPurchaseDate = details?.purchaseDate 
      ? new Date(details.purchaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      
    const formattedExpiryDate = details?.expiryDate && details.expiryDate !== "Never"
      ? new Date(details.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
      : "Lifetime Validity";

    const handleManage = async () => {
      tapHaptic();
      if (Capacitor.isNativePlatform()) {
        try {
          await NativePurchases.manageSubscriptions();
        } catch (err) {
          console.error("Error opening subscription management:", err);
          toast({
            title: "Error",
            description: "Could not open Google Play Store subscription manager.",
          });
        }
      } else {
        toast({
          title: "Manage Subscription",
          description: "On a native device, this opens Google Play Store subscription management.",
        });
      }
    };

    const handleDeactivate = () => {
      tapHaptic();
      setPro(false);
      setProState(false);
      localStorage.removeItem("pro-purchased");
      toast({
        title: "Pro Deactivated",
        description: "Your Pro status has been disabled for sandbox testing.",
      });
    };

    const handleToggleCancel = () => {
      tapHaptic();
      const current = localStorage.getItem("pro-subscription-cancelled") === "1";
      localStorage.setItem("pro-subscription-cancelled", current ? "0" : "1");
      window.dispatchEvent(new Event("pro:updated"));
      toast({
        title: current ? "Auto-Renew Restored" : "Subscription Cancelled",
        description: current 
          ? "Simulated subscription auto-renewal successfully restored!" 
          : "Simulated subscription cancellation! Pro features will remain active until expiry date.",
      });
    };

    const handleExtendExpiry = () => {
      tapHaptic();
      const currentDetails = getProDetails();
      if (!currentDetails) return;
      
      const prevExpiry = currentDetails.expiryDate !== "Never" ? new Date(currentDetails.expiryDate) : new Date();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      let newExpiry = "Never";
      
      if (currentDetails.planType === "monthly") {
        newExpiry = new Date(prevExpiry.getTime() + 30 * oneDayInMs).toISOString();
      } else if (currentDetails.planType === "yearly") {
        newExpiry = new Date(prevExpiry.getTime() + 365 * oneDayInMs).toISOString();
      }
      
      localStorage.setItem("pro-expiry-date", newExpiry);
      window.dispatchEvent(new Event("pro:updated"));
      toast({
        title: "Subscription Extended",
        description: `Extended simulated expiration date to: ${new Date(newExpiry).toLocaleDateString()}`,
      });
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
          {/* Active Premium Card */}
          <div className="mt-4 rounded-3xl border border-accent/40 bg-gradient-to-br from-accent/20 via-accent/5 to-transparent p-6 shadow-lg shadow-accent/5 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
            
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-black uppercase tracking-wider text-accent-foreground shadow-sm">
              <Crown size={12} className="animate-pulse" /> Active Member
            </div>
            
            <h2 className="mt-4 text-3xl font-serif font-bold leading-tight">
              You are a Pro!
            </h2>
            <p className="text-[14px] text-muted-foreground mt-2">
              Enjoy all premium features and a complete ad-free experience. Thank you for your support!
            </p>

            <div className="mt-6 border-t border-border/60 pt-5 space-y-4">
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-muted-foreground font-medium">Subscription Plan</span>
                <span className="font-bold text-foreground bg-accent/10 px-2.5 py-0.5 rounded-full text-[12px] uppercase tracking-wide">
                  {planName} Pro
                </span>
              </div>
              
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-muted-foreground font-medium">Subscription Status</span>
                {details?.isCancelled ? (
                  <span className="font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full text-[12px] uppercase tracking-wide">
                    Cancelled (Active)
                  </span>
                ) : (
                  <span className="font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full text-[12px] uppercase tracking-wide">
                    {isLifetime ? "Lifetime" : "Auto-Renewing"}
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-muted-foreground font-medium">Billing Channel</span>
                <span className="font-semibold text-foreground">Google Play Store</span>
              </div>
              
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-muted-foreground font-medium">Purchase Date</span>
                <span className="font-semibold text-foreground">{formattedPurchaseDate}</span>
              </div>

              <div className="flex justify-between items-center text-[14px]">
                <span className="text-muted-foreground font-medium">
                  {isLifetime ? "Validity" : details?.isCancelled ? "Access Expiry" : "Next Renewal Date"}
                </span>
                <span className={cn(
                  "font-bold",
                  isLifetime ? "text-accent" : details?.isCancelled ? "text-amber-500" : "text-foreground"
                )}>
                  {formattedExpiryDate}
                </span>
              </div>
            </div>

            {details?.isCancelled && !isLifetime && (
              <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-[13px] text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
                Your subscription has been cancelled. Your Pro membership benefits will remain fully active until your paid period ends on {formattedExpiryDate}.
              </div>
            )}
          </div>

          {/* Features check list (for confirmation) */}
          <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1 mt-8 mb-2.5">
            Active Features
          </h3>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-accent" strokeWidth={3} />
                </div>
                <div className="text-[14px] leading-relaxed text-muted-foreground">{f}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            <button
              onClick={handleManage}
              className="w-full rounded-2xl bg-foreground text-background py-4 text-[15px] font-bold shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Manage Google Play Subscription
            </button>
            
            {/* Sandbox Testing Controls */}
            <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-5">
              <h4 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Sandbox Subscription Simulator
              </h4>
              
              <div className="grid grid-cols-1 gap-2">
                {!isLifetime && (
                  <>
                    <button
                      onClick={handleToggleCancel}
                      className="w-full rounded-2xl border border-border bg-background py-3 text-[13px] font-semibold text-foreground hover:bg-muted transition-smooth"
                    >
                      {details?.isCancelled ? "Restore Auto-Renewal" : "Simulate Cancel (Keep Paid Period)"}
                    </button>
                    
                    <button
                      onClick={handleExtendExpiry}
                      className="w-full rounded-2xl border border-border bg-background py-3 text-[13px] font-semibold text-foreground hover:bg-muted transition-smooth"
                    >
                      Simulate Renewal (Extend Paid Cycle)
                    </button>
                  </>
                )}
                
                <button
                  onClick={handleDeactivate}
                  className="w-full rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 py-3 text-[13px] font-semibold hover:bg-red-500/10 transition-smooth"
                >
                  Force Hard Deactivation (Reset to Non-Pro)
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
        <div className="mt-1.5 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent p-5">
          <div className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-accent-foreground">
            <Crown size={11} /> Pro
          </div>
          <h2 className="mt-2.5 text-[22px] font-serif font-bold leading-tight">
            Build your perfect day, beautifully.
          </h2>
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
          onClick={handlePurchase}
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

        <button
          onClick={handleRestore}
          className="mt-6 w-full text-center text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-smooth"
        >
          Restore Purchase
        </button>
      </main>
    </div>
  );
};

export default Pro;
