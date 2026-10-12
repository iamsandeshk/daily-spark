import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { tapHaptic, successHaptic } from "@/lib/haptics";
import { isPro, setPro, getProDetails, syncProSubscription, PRODUCT_IDS } from "@/lib/pro";
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

// Resolved, ready-to-purchase product info taken directly from Google Play.
// We never hardcode the identifiers used for the actual purchase — we use exactly
// what Google Play returned, which prevents "item could not be found" errors when
// the Play Console base-plan / product IDs differ from our internal keys.
type PurchasableProduct = {
  priceString: string;
  // Android subscriptions: the subscription PRODUCT id (productDetails.getProductId()).
  // INAPP / fallback: the product id.
  productIdentifier: string;
  // Android subscriptions only: the BASE PLAN id (offerDetails.getBasePlanId()).
  planIdentifier?: string;
  productType: PURCHASE_TYPE;
};

const FEATURES = [
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
  const [prices, setPrices] = useState<Record<string, string> | null>(null);
  const [pricesStatus, setPricesStatus] = useState<"loading" | "loaded" | "error">("loading");
  // Real, purchasable products resolved from Google Play, keyed by our internal plan id.
  const [products, setProducts] = useState<Record<string, PurchasableProduct>>({});
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const initBilling = async () => {
      // Sync subscription entitlement status on mount first. 
      // This also helps establish the initial connection to Google Play Billing.
      await syncProSubscription();

      // On web: prices can't be fetched from Play Store — go straight to error
      if (!Capacitor.isNativePlatform()) {
        setPricesStatus("error");
        return;
      }

      // Ensure billing is supported / fully connected before asking for products
      try {
        await NativePurchases.isBillingSupported();
      } catch (err) {
        console.warn("Billing might not be supported or ready yet:", err);
      }

      // Fetch real Google Play Store pricing
    const fetchPlayStorePrices = async () => {
      try {
        const updatedPrices: Record<string, string> = {};
        const resolved: Record<string, PurchasableProduct> = {};

        // Map a returned Play product onto our internal plan id ("monthly"/"yearly"/"lifetime").
        // On Android subscriptions, `identifier` = base plan id and `planIdentifier` = subscription
        // product id, so we match against BOTH to be configuration-agnostic.
        const matchPlan = (p: { identifier?: string; planIdentifier?: string }): Plan["id"] | null => {
          const candidates = [p.identifier, p.planIdentifier];
          if (candidates.includes(PRODUCT_IDS.monthly)) return "monthly";
          if (candidates.includes(PRODUCT_IDS.yearly)) return "yearly";
          if (candidates.includes(PRODUCT_IDS.lifetime)) return "lifetime";
          return null;
        };

        // Query subscriptions (Monthly & Yearly)
        const subResult = await NativePurchases.getProducts({
          productIdentifiers: [PRODUCT_IDS.monthly, PRODUCT_IDS.yearly],
          productType: PURCHASE_TYPE.SUBS
        });

        if (subResult?.products) {
          subResult.products.forEach((p) => {
            const planKey = matchPlan(p);
            if (!planKey || planKey === "lifetime" || !p.priceString) return;
            // Don't overwrite an already-resolved plan (in case Play returns duplicates).
            if (resolved[planKey]) return;
            updatedPrices[planKey] = p.priceString;
            resolved[planKey] = {
              priceString: p.priceString,
              // For Android subs: purchase needs the subscription PRODUCT id. The plugin
              // exposes that as `planIdentifier`; fall back to `identifier` if absent.
              productIdentifier: p.planIdentifier ?? p.identifier,
              // ...and the BASE PLAN id, which the plugin exposes as `identifier`.
              planIdentifier: p.identifier,
              productType: PURCHASE_TYPE.SUBS,
            };
          });
        }

        // Query one-time in-app purchase (Lifetime)
        const inAppResult = await NativePurchases.getProducts({
          productIdentifiers: [PRODUCT_IDS.lifetime],
          productType: PURCHASE_TYPE.INAPP
        });

        if (inAppResult?.products) {
          inAppResult.products.forEach((p) => {
            const planKey = matchPlan(p);
            if (planKey !== "lifetime" || !p.priceString || resolved.lifetime) return;
            updatedPrices.lifetime = p.priceString;
            resolved.lifetime = {
              priceString: p.priceString,
              // INAPP: purchase by product id; no base plan involved.
              productIdentifier: p.identifier,
              productType: PURCHASE_TYPE.INAPP,
            };
          });
        }

        // Mark loaded if we resolved at least one purchasable product. This keeps the page
        // working even if one product (e.g. lifetime) isn't fully configured yet on Play Console.
        if (Object.keys(resolved).length > 0) {
          setPrices(updatedPrices);
          setProducts(resolved);
          setPricesStatus("loaded");

          // Make sure the selected plan is actually purchasable; otherwise pick the first one
          // that is, so the Continue button never points at a missing product.
          setSelected((prev) => (resolved[prev] ? prev : (Object.keys(resolved)[0] as Plan["id"])));

          if (!resolved.monthly || !resolved.yearly || !resolved.lifetime) {
            console.warn("Incomplete pricing from Play Store:", Object.keys(resolved));
          }
        } else {
          console.error("Could not resolve any products from Play Store. Check billing permissions or product IDs in Console.");
          setPricesStatus("error");
        }
      } catch (err) {
        console.error("Error fetching Google Play Store prices:", err);
        setPricesStatus("error");
      }
    };

      await fetchPlayStorePrices();
    };

    initBilling();
  }, []);

  useEffect(() => {
    const onUpdate = () => setProState(isPro());
    window.addEventListener("pro:updated", onUpdate);
    return () => window.removeEventListener("pro:updated", onUpdate);
  }, []);

  const handlePurchase = async () => {
    if (!Capacitor.isNativePlatform()) {
      tapHaptic();
      toast({
        title: "Android App Required",
        description: "Purchases can only be made through the Android app on Google Play.",
      });
      return;
    }

    if (purchasing) return;

    // Use the EXACT product Google Play returned. If it isn't resolved yet, don't
    // attempt a purchase with guessed IDs (that's what triggers "item could not be found").
    const product = products[selected];
    if (!product) {
      tapHaptic();
      toast({
        title: "Plan unavailable",
        description: "This plan couldn't be loaded from Google Play yet. Please wait a moment and try again.",
      });
      return;
    }

    // Native device — initiate real Google Play billing
    setPurchasing(true);
    try {
      const tx = await NativePurchases.purchaseProduct({
        productIdentifier: product.productIdentifier,
        // For subscriptions, pass the base plan id; INAPP (lifetime) has none.
        planIdentifier: product.productType === PURCHASE_TYPE.SUBS ? product.planIdentifier : undefined,
        productType: product.productType,
      });

      // purchaseProduct only resolves on a successful purchase, so we can grant Pro directly
      // from the verified transaction. We intentionally do NOT re-query Google Play here:
      // queryPurchases can briefly lag right after a purchase and would wrongly downgrade.
      // The periodic/resume sync reconciles details shortly after.

      // Some payment methods (e.g. cash) leave the purchase PENDING (purchaseState "0").
      // Don't grant Pro until payment actually completes.
      if (tx?.purchaseState === "0") {
        tapHaptic();
        toast({
          title: "Purchase Pending",
          description: "Your payment is processing. Pro will activate automatically once it completes.",
        });
        return;
      }

      const expiryStr = tx?.expirationDate ? new Date(tx.expirationDate).toISOString() : "Never";
      const purchaseDateStr = tx?.purchaseDate ? new Date(tx.purchaseDate).toISOString() : undefined;
      setPro(true, selected, expiryStr, purchaseDateStr);

      setProState(true);
      successHaptic();
      toast({
        title: "Welcome to Pro!",
        description: `Successfully activated Daily Routines Pro (${selected} plan).`,
      });
      navigate(-1);
    } catch (err: unknown) {
      console.error("Native purchase error:", err);
      const e = err as { code?: string; message?: string };
      // Don't show error for user-initiated cancellation
      const cancelled =
        e?.code === "E_USER_CANCELLED" ||
        e?.message?.toLowerCase().includes("cancel") ||
        e?.message?.toLowerCase().includes("dismiss");
      if (!cancelled) {
        toast({
          title: "Purchase Failed",
          description: e?.message || "Something went wrong. Please try again.",
        });
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        // ── 1. Tell Google Play to restore all previous purchases ───────────
        await NativePurchases.restorePurchases();

        // ── 2. Sync to verify if any valid entitlements exist ───────────────
        await syncProSubscription();

        if (isPro()) {
          setProState(true);
          successHaptic();
          toast({
            title: "Purchases Restored",
            description: "Your Pro access has been successfully restored.",
          });
          navigate(-1);
        } else {
          toast({
            title: "No Active Subscription",
            description: "We couldn't find an active Pro subscription or lifetime purchase on this Google account.",
          });
        }
      } catch (err) {
        console.error("Native restore error:", err);
        toast({
          title: "Restore Failed",
          description: "Could not contact Google Play. Please check your connection and try again.",
        });
      }
      return;
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
    { id: "monthly",  name: "Monthly",  price: prices?.monthly ?? "",  period: "/ month", sub: "Billed every month" },
    { id: "yearly",   name: "Yearly",   price: prices?.yearly  ?? "",  period: "/ year",  sub: "Save 44% vs monthly", badge: "Most popular" },
    { id: "lifetime", name: "Lifetime", price: prices?.lifetime ?? "", period: "one-time", sub: "Pay once, yours forever" },
  ];

  // Once Play Store data is loaded, only show plans that are actually purchasable.
  const visiblePlans = pricesStatus === "loaded" ? PLANS.filter((p) => products[p.id]) : PLANS;

  if (pro) {
    const details = getProDetails();
    const isLifetime = details?.planType === "lifetime";
    const planName = details ? details.planType.charAt(0).toUpperCase() + details.planType.slice(1) : "Yearly";
    
    const formattedPurchaseDate = details?.purchaseDate 
      ? new Date(details.purchaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      
    const formattedExpiryDate = details?.expiryDate && details.expiryDate !== "Never"
      ? new Date(details.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
      : isLifetime
        ? "Lifetime Validity"
        // Subscription with no known date (Android doesn't expose expiry via billing) —
        // the real renewal/expiry is managed by Google Play.
        : "Managed by Google Play";

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


    return (
      <div className="min-h-full bg-background pb-20 no-select">
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md safe-top px-5 pb-3 pt-3 flex items-center gap-3 border-b border-border/40">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Daily Routines Pro</h1>
        </header>

        <main className="px-5">
          {/* Active Premium Card */}
          <div className="mt-5 rounded-3xl border border-accent/40 bg-gradient-to-br from-accent/20 via-accent/5 to-card p-6 shadow-xl shadow-accent/10 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-black uppercase tracking-wider text-accent-foreground shadow-sm">
              <Crown size={12} className="animate-pulse" /> Active Member
            </div>
            
            <h2 className="mt-4 text-2xl font-bold tracking-tight leading-tight">
              You are a Pro member!
            </h2>
            <p className="text-[13px] text-muted-foreground mt-1.5">
              Enjoy all premium themes, unlimited routines, and full insights.
            </p>

            <div className="mt-6 border-t border-border/60 pt-5 space-y-3.5">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-muted-foreground font-medium">Subscription Plan</span>
                <span className="font-bold text-foreground bg-accent/15 px-2.5 py-0.5 rounded-full text-[12px] uppercase tracking-wide">
                  {planName} Pro
                </span>
              </div>
              
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-muted-foreground font-medium">Subscription Status</span>
                {details?.isCancelled ? (
                  <span className="font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full text-[12px] uppercase tracking-wide">
                    Cancelled (Active)
                  </span>
                ) : (
                  <span className="font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full text-[12px] uppercase tracking-wide">
                    {isLifetime ? "Lifetime Access" : "Auto-Renewing"}
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-muted-foreground font-medium">Billing Channel</span>
                <span className="font-semibold text-foreground">Google Play Store</span>
              </div>
              
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-muted-foreground font-medium">Purchase Date</span>
                <span className="font-semibold text-foreground">{formattedPurchaseDate}</span>
              </div>

              <div className="flex justify-between items-center text-[13px]">
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
              <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-[12px] text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
                Your subscription has been cancelled. Your Pro membership benefits will remain fully active until your paid period ends on {formattedExpiryDate}.
              </div>
            )}
          </div>

          {/* Features check list (for confirmation) */}
          <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-bold px-1 mt-8 mb-3">
            Active Features
          </h3>
          <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm divide-y divide-border/60 overflow-hidden shadow-sm">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-accent" strokeWidth={3} />
                </div>
                <div className="text-[13px] leading-relaxed text-muted-foreground">{f}</div>
              </div>
            ))}
          </div>

          <div className="mt-7 space-y-4">
            <button
              onClick={handleManage}
              className="w-full rounded-2xl bg-foreground text-background py-4 text-[14px] font-bold shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Manage Google Play Subscription
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background pb-20 no-select">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md safe-top px-5 pb-3 pt-3 flex items-center gap-3 border-b border-border/40">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Daily Routines Pro</h1>
      </header>

      <main className="px-5">
        {/* Hero */}
        <div className="mt-4 rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/20 via-accent/5 to-card p-6 relative overflow-hidden shadow-lg shadow-accent/5">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[10px] font-black uppercase tracking-wider text-accent-foreground shadow-sm">
            <Crown size={11} /> Pro Upgrade
          </div>
          <h2 className="mt-3.5 text-2xl font-bold tracking-tight leading-snug">
            Build your perfect day, beautifully.
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Unlock all custom theme accents, unlimited routines, rich charts, and cloud sync.
          </p>
        </div>

        {/* Plans */}
        <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-bold px-1 mt-7 mb-3">
          Choose your plan
        </h3>
        <div className="space-y-3">
          {visiblePlans.map((p) => {
            const active = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => { setSelected(p.id); tapHaptic(); }}
                disabled={pricesStatus !== "loaded"}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition-all relative flex items-center gap-3.5 overflow-hidden",
                  active
                    ? "border-accent bg-accent/[0.08] shadow-md shadow-accent/10 ring-1 ring-accent/40"
                    : "border-border/70 bg-card hover:bg-muted/50 active:scale-[0.99]",
                  pricesStatus !== "loaded" && "opacity-60 cursor-default"
                )}
              >
                {/* Active glow accent indicator */}
                {active && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
                )}

                <div className={cn(
                  "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                  active ? "border-accent bg-accent" : "border-muted-foreground/30"
                )}>
                  {active && <Check size={12} className="text-accent-foreground" strokeWidth={3} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-foreground">{p.name}</span>
                    {p.badge && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-accent text-accent-foreground px-2 py-0.5 rounded-full shadow-sm">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  {p.sub && <div className="text-[12px] text-muted-foreground mt-0.5">{p.sub}</div>}
                </div>

                <div className="text-right shrink-0">
                  {pricesStatus === "loading" ? (
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="h-5 w-16 rounded-md bg-muted animate-pulse" />
                      <div className="h-3 w-10 rounded-md bg-muted animate-pulse" />
                    </div>
                  ) : pricesStatus === "error" ? (
                    <div className="text-[12px] text-muted-foreground">—</div>
                  ) : (
                    <>
                      <div className="text-[17px] font-bold tabular-nums text-foreground">{p.price}</div>
                      <div className="text-[11px] text-muted-foreground">{p.period}</div>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {pricesStatus === "loaded" ? (
          <>
            <button
              onClick={handlePurchase}
              disabled={purchasing || !products[selected]}
              className="mt-6 w-full rounded-2xl bg-foreground text-background py-4 text-[15px] font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-default"
            >
              {purchasing ? "Processing with Google Play…" : `Continue — ${prices?.[selected] ?? ""}`}
            </button>
            <p className="text-center text-[11px] text-muted-foreground mt-2.5">
              Cancel anytime via Google Play. No hidden fees.
            </p>
          </>
        ) : pricesStatus === "loading" ? (
          <div className="mt-6 h-14 w-full rounded-2xl bg-muted/60 animate-pulse" />
        ) : (
          /* Prices failed to load — show contact developer card */
          <div className="mt-6 rounded-2xl border border-border bg-card/60 p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground">Unable to load prices</p>
              <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                Could not connect to Google Play. Please contact the developer for assistance.
              </p>
              <a
                href="mailto:try.sandeshk@gmail.com"
                className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl bg-foreground text-background text-[12px] font-semibold hover:opacity-90 transition-opacity"
              >
                Contact Developer
              </a>
            </div>
          </div>
        )}

        {/* Features */}
        <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-bold px-1 mt-8 mb-3">
          What's included
        </h3>
        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm divide-y divide-border/60 overflow-hidden shadow-sm">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-start gap-3 px-4 py-3">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                <Check size={12} className="text-accent" strokeWidth={3} />
              </div>
              <div className="text-[13px] leading-relaxed text-foreground/90">{f}</div>
            </div>
          ))}
        </div>

        <button
          onClick={handleRestore}
          className="mt-6 w-full text-center text-[13px] font-semibold text-muted-foreground hover:text-foreground active:opacity-75 transition-smooth py-2"
        >
          Restore Purchase
        </button>


      </main>
    </div>
  );
};

export default Pro;
