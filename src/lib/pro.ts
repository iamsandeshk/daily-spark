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

// ─── Temporary ad-free window (e.g. earned by watching a rewarded ad) ──────
const ADS_DISABLED_KEY = "ads-disabled-until";

export const getAdsDisabledUntil = (): number => {
  const v = Number(localStorage.getItem(ADS_DISABLED_KEY) || 0);
  return Number.isFinite(v) ? v : 0;
};

export const areAdsTemporarilyDisabled = (): boolean =>
  getAdsDisabledUntil() > Date.now();

export const disableAdsForHours = (hours: number) => {
  const base = Math.max(getAdsDisabledUntil(), Date.now());
  const until = base + hours * 60 * 60 * 1000;
  localStorage.setItem(ADS_DISABLED_KEY, String(until));
  window.dispatchEvent(new Event("pro:updated"));
};

// Ads are off whenever the user is Pro OR inside a temporary ad-free window.
export const adsDisabled = (): boolean => isPro() || areAdsTemporarilyDisabled();

export const getProDetails = (): ProDetails | null => {
  const enabled = isPro();
  if (!enabled) return null;
  
  const planType = (localStorage.getItem("pro-plan-type") || "yearly") as "monthly" | "yearly" | "lifetime";
  const purchaseDate = localStorage.getItem("pro-purchase-date") || new Date().toISOString();
  const expiryDate = localStorage.getItem("pro-expiry-date") || "Never";
  const isCancelled = localStorage.getItem("pro-subscription-cancelled") === "1";
  
  return { planType, purchaseDate, expiryDate, isCancelled };
};

export const setPro = (v: boolean, planType: "monthly" | "yearly" | "lifetime" = "yearly") => {
  localStorage.setItem(KEY, v ? "1" : "0");
  if (v) {
    localStorage.setItem("pro-plan-type", planType);
    const purchaseDate = new Date().toISOString();
    localStorage.setItem("pro-purchase-date", purchaseDate);
    localStorage.setItem("pro-subscription-cancelled", "0");
    
    let expiryDate = "Never";
    if (planType === "monthly") {
      expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (planType === "yearly") {
      expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    }
    // lifetime stays "Never"
    localStorage.setItem("pro-expiry-date", expiryDate);
  } else {
    localStorage.removeItem("pro-plan-type");
    localStorage.removeItem("pro-purchase-date");
    localStorage.removeItem("pro-expiry-date");
    localStorage.removeItem("pro-subscription-cancelled");
    // Pro ended — revert any Pro-only customizations to the free defaults.
    enforceFreeColorTheme();
    enforceFreeAppearance();
    enforceFreeMoodConfig();
  }
  window.dispatchEvent(new Event("pro:updated"));
};

export const syncProSubscription = async () => {
  const enabled = isPro();
  if (!enabled) return;

  const details = getProDetails();
  if (!details) return;

  const { planType, expiryDate, isCancelled } = details;

  // Lifetime purchases never expire — nothing to sync
  if (planType === "lifetime" || expiryDate === "Never") return;

  const now = new Date();
  const expiry = new Date(expiryDate);
  const oneDayInMs = 24 * 60 * 60 * 1000;
  
  // Calculate if we are on the last day or past expiration
  const msRemaining = expiry.getTime() - now.getTime();
  const isLastDayOrLater = msRemaining <= oneDayInMs;

  if (Capacitor.isNativePlatform()) {
    try {
      // Query current entitlements from Google Play using the correct product ID
      const { purchases } = await NativePurchases.getPurchases({ onlyCurrentEntitlements: true });
      const productId = PRODUCT_IDS[planType]; // "monthly" or "yearly"
      
      // Find matching active subscription purchase
      const activePurchase = purchases?.find(
        (p) => p.productIdentifier === productId || p.productIdentifier.includes(planType)
      );

      if (activePurchase) {
        // Entitled on Google Play.
        
        // Check if transaction reports cancellation status (e.g. willCancel)
        const storeCancelled = activePurchase.willCancel === true;
        if (storeCancelled) {
          localStorage.setItem("pro-subscription-cancelled", "1");
        } else if (activePurchase.willCancel === false) {
          localStorage.setItem("pro-subscription-cancelled", "0");
        }

        // Check if there is an explicit expirationDate from the native transaction
        if (activePurchase.expirationDate) {
          const storeExpiry = new Date(activePurchase.expirationDate);
          localStorage.setItem("pro-expiry-date", storeExpiry.toISOString());
          
          // If the store expiry is in the past and they cancelled, deactivate Pro
          if (now.getTime() > storeExpiry.getTime() && (storeCancelled || localStorage.getItem("pro-subscription-cancelled") === "1")) {
            setPro(false);
            return;
          }
        } else {
          // Fallback calculation for Android (expirationDate not always present on Android client)
          if (isLastDayOrLater) {
            // Still active in Google Play — must have renewed. Extend local expiry.
            const prevExpiry = new Date(expiryDate);
            let newExpiry = "Never";
            
            if (planType === "monthly") {
              newExpiry = new Date(prevExpiry.getTime() + 30 * oneDayInMs).toISOString();
            } else if (planType === "yearly") {
              newExpiry = new Date(prevExpiry.getTime() + 365 * oneDayInMs).toISOString();
            }
            
            localStorage.setItem("pro-expiry-date", newExpiry);
            if (activePurchase.willCancel === null) {
              // Active on Android — assume renewed
              localStorage.setItem("pro-subscription-cancelled", "0"); 
            }
          }
        }
        window.dispatchEvent(new Event("pro:updated"));
      } else {
        // No longer returned as active entitlement in Google Play.
        // Either cancelled+expired, or cancelled+in paid period.
        if (now.getTime() > expiry.getTime()) {
          setPro(false);
        } else {
          // Keep active but mark as cancelled (will expire exactly on expiryDate)
          localStorage.setItem("pro-subscription-cancelled", "1");
          window.dispatchEvent(new Event("pro:updated"));
        }
      }
    } catch (err) {
      console.error("Error synchronizing native subscriptions:", err);
    }
  } else {
    // Web / Simulator environment
    if (now.getTime() > expiry.getTime()) {
      if (isCancelled) {
        // Cancelled and fully expired, deactivate Pro
        setPro(false);
      } else {
        // Auto-renewing, extend it!
        const prevExpiry = new Date(expiryDate);
        let newExpiry = "Never";
        
        if (planType === "monthly") {
          newExpiry = new Date(prevExpiry.getTime() + 30 * oneDayInMs).toISOString();
        } else if (planType === "yearly") {
          newExpiry = new Date(prevExpiry.getTime() + 365 * oneDayInMs).toISOString();
        }
        
        localStorage.setItem("pro-expiry-date", newExpiry);
        window.dispatchEvent(new Event("pro:updated"));
      }
    }
  }
};

export const FREE_ROUTINE_LIMIT = 3;

export const canAddRoutine = (activeCount: number): boolean =>
  isPro() || activeCount < FREE_ROUTINE_LIMIT;
