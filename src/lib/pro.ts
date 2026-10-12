import { Capacitor } from "@capacitor/core";
import { enforceFreeColorTheme } from "./color-themes";
import { enforceFreeAppearance } from "./appearance";
import { enforceFreeMoodConfig } from "./mood-customization";
import { NativePurchases } from "@capgo/native-purchases";

const KEY = "pro-enabled";

// ─── Product IDs — must match Google Play Console exactly ──────────────────
export const PRODUCT_IDS = {
  monthly: "monthly",
  yearly: "yearly",
  lifetime: "lifetime",
} as const;

// Base Plan IDs for subscriptions (set in Play Console under each subscription)
export const PLAN_IDS = {
  monthly: "monthly",
  yearly: "yearly",
} as const;

export interface ProDetails {
  planType: "monthly" | "yearly" | "lifetime";
  purchaseDate: string;
  expiryDate: string;
  isCancelled: boolean;
}

export const isPro = (): boolean => localStorage.getItem(KEY) === "1";


export const getProDetails = (): ProDetails | null => {
  const enabled = isPro();
  if (!enabled) return null;
  
  const planType = (localStorage.getItem("pro-plan-type") || "yearly") as "monthly" | "yearly" | "lifetime";
  const purchaseDate = localStorage.getItem("pro-purchase-date") || new Date().toISOString();
  const expiryDate = localStorage.getItem("pro-expiry-date") || "Never";
  const isCancelled = localStorage.getItem("pro-subscription-cancelled") === "1";
  
  return { planType, purchaseDate, expiryDate, isCancelled };
};

export const setPro = (
  v: boolean,
  planType: "monthly" | "yearly" | "lifetime" = "yearly",
  expiryDate: string = "Never",
  purchaseDateStr?: string,
  isCancelled?: boolean
) => {
  const currentPro = localStorage.getItem(KEY) === "1";
  const currentPlan = localStorage.getItem("pro-plan-type");
  const currentExpiry = localStorage.getItem("pro-expiry-date");
  const currentPurchase = localStorage.getItem("pro-purchase-date");
  const currentCancel = localStorage.getItem("pro-subscription-cancelled");

  let changed = currentPro !== v;

  localStorage.setItem(KEY, v ? "1" : "0");
  if (v) {
    if (currentPlan !== planType) changed = true;
    localStorage.setItem("pro-plan-type", planType);
    
    if (purchaseDateStr) {
      if (currentPurchase !== purchaseDateStr) changed = true;
      localStorage.setItem("pro-purchase-date", purchaseDateStr);
    } else if (!currentPurchase) {
      localStorage.setItem("pro-purchase-date", new Date().toISOString());
      changed = true;
    }

    if (isCancelled !== undefined) {
      const cancelStr = isCancelled ? "1" : "0";
      if (currentCancel !== cancelStr) changed = true;
      localStorage.setItem("pro-subscription-cancelled", cancelStr);
    } else if (currentCancel === null) {
      localStorage.setItem("pro-subscription-cancelled", "0");
      changed = true;
    }

    if (currentExpiry !== expiryDate) changed = true;
    localStorage.setItem("pro-expiry-date", expiryDate);
  } else {
    if (currentPlan !== null) changed = true;
    localStorage.removeItem("pro-plan-type");
    localStorage.removeItem("pro-purchase-date");
    localStorage.removeItem("pro-expiry-date");
    localStorage.removeItem("pro-subscription-cancelled");
    
    if (changed) {
      enforceFreeColorTheme();
      enforceFreeAppearance();
      enforceFreeMoodConfig();
    }
  }

  if (changed) {
    window.dispatchEvent(new Event("pro:updated"));
  }
};

// One day in milliseconds — local grace window applied after a known expiry date.
const EXPIRY_GRACE_MS = 24 * 60 * 60 * 1000;

// Apply a purely local expiry check. Used as a safety net when Google Play
// cannot be reached (offline). Never downgrades while the date is unknown so a
// paying user is never wrongly demoted just because we couldn't verify.
const applyLocalExpiryFallback = () => {
  if (!isPro()) return;
  const details = getProDetails();
  if (!details) return;

  const { planType, expiryDate } = details;
  // Lifetime never expires, and an unknown expiry can't be evaluated locally.
  if (planType === "lifetime" || expiryDate === "Never") return;

  const expiry = new Date(expiryDate).getTime();
  if (Number.isNaN(expiry)) return;

  // Remove Pro only once we're past expiry + the 1-day grace window.
  if (Date.now() > expiry + EXPIRY_GRACE_MS) {
    setPro(false);
  }
};

let syncing = false;

export const syncProSubscription = async () => {
  if (syncing) return;
  syncing = true;

  try {
    if (Capacitor.isNativePlatform()) {
      // Step 1: confirm Google Play Billing is actually connected.
      // If we can't confirm, we must NOT touch the cached Pro state — otherwise a
      // valid Pro user could be wrongly downgraded on a transient/offline failure.
      let billingReady = false;
      try {
        const res = await NativePurchases.isBillingSupported();
        billingReady = res?.isBillingSupported === true;
      } catch (e) {
        console.warn("Billing not ready/supported — keeping cached Pro state:", e);
      }

      if (!billingReady) {
        // Offline / billing unavailable: keep cache, only apply local expiry grace.
        applyLocalExpiryFallback();
        return;
      }

      let activePurchases;
      let allPurchases;
      try {
        // onlyCurrentEntitlements is iOS-only; on Android both queries return the
        // same active set (Google Play already excludes expired subscriptions).
        ({ purchases: activePurchases } = await NativePurchases.getPurchases({ onlyCurrentEntitlements: true }));
        // Query all purchases too (reliably surfaces lifetime INAPP purchases).
        ({ purchases: allPurchases } = await NativePurchases.getPurchases({ onlyCurrentEntitlements: false }));
      } catch (err) {
        // Query failed even though billing reported ready — treat as inconclusive,
        // keep the cached entitlement rather than downgrading.
        console.error("Error querying purchases — keeping cached Pro state:", err);
        applyLocalExpiryFallback();
        return;
      }

      // Subscriptions are evaluated from the active/current entitlements.
      const activeSub = activePurchases?.find((p) => {
        const id = p.productIdentifier ?? "";
        // On Android verify purchase state is "1" (Purchased) when present.
        const isValidState = !p.purchaseState || p.purchaseState === "1";
        return (id === PRODUCT_IDS.monthly || id === PRODUCT_IDS.yearly) && isValidState;
      });

      // Lifetime is evaluated from all purchases (INAPP never expires).
      const lifetime = allPurchases?.find((p) => {
        const id = p.productIdentifier ?? "";
        const isValidState = !p.purchaseState || p.purchaseState === "1";
        return id === PRODUCT_IDS.lifetime && isValidState;
      });

      const activeEntitlement = lifetime || activeSub;

      if (activeEntitlement) {
        const id = activeEntitlement.productIdentifier ?? "";
        let planType: "monthly" | "yearly" | "lifetime";

        if (id === PRODUCT_IDS.monthly) {
          planType = "monthly";
        } else if (id === PRODUCT_IDS.yearly) {
          planType = "yearly";
        } else {
          planType = "lifetime";
        }

        // NOTE: expirationDate is iOS-only. On Android it is undefined, so the
        // expiry stays "Never" and renewal/expiry handling is delegated to Google
        // Play (expired subscriptions simply drop out of the query above).
        let expiryStr = "Never";
        if (activeEntitlement.expirationDate) {
          expiryStr = new Date(activeEntitlement.expirationDate).toISOString();
        } else {
          // Preserve any previously known expiry date for this same plan.
          const prevExpiry = localStorage.getItem("pro-expiry-date");
          const prevPlan = localStorage.getItem("pro-plan-type");
          if (prevExpiry && prevPlan === planType) expiryStr = prevExpiry;
        }

        // Capture the purchase date accurately if available.
        let purchaseDateStr = undefined;
        if (activeEntitlement.purchaseDate) {
          purchaseDateStr = new Date(activeEntitlement.purchaseDate).toISOString();
        } else if (activeEntitlement.originalPurchaseDate) {
          purchaseDateStr = new Date(activeEntitlement.originalPurchaseDate).toISOString();
        }

        // willCancel is iOS-only (null on Android) — leave undefined to keep prior value there.
        const isCancelled = typeof activeEntitlement.willCancel === "boolean" ? activeEntitlement.willCancel : undefined;
        setPro(true, planType, expiryStr, purchaseDateStr, isCancelled);
      } else {
        // Billing is connected AND the query succeeded with no entitlement:
        // this is an authoritative negative, so it's safe to downgrade.
        if (isPro()) setPro(false);
      }
    } else {
      // Web / Simulator environment (dummy check)
      const enabled = isPro();
      if (!enabled) return;

      const details = getProDetails();
      if (!details) return;

      const { planType, expiryDate, isCancelled } = details;
      if (planType === "lifetime" || expiryDate === "Never") return;

      const now = new Date();
      const expiry = new Date(expiryDate);

      if (now.getTime() > expiry.getTime() && isCancelled) {
        setPro(false);
      }
    }
  } finally {
    syncing = false;
  }
};

export const FREE_ROUTINE_LIMIT = 3;

export const canAddRoutine = (activeCount: number): boolean =>
  isPro() || activeCount < FREE_ROUTINE_LIMIT;
