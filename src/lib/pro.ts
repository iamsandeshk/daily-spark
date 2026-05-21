import { Capacitor } from "@capacitor/core";
import { NativePurchases } from "@capgo/native-purchases";

const KEY = "pro-enabled";

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
    localStorage.setItem("pro-expiry-date", expiryDate);
  } else {
    localStorage.removeItem("pro-plan-type");
    localStorage.removeItem("pro-purchase-date");
    localStorage.removeItem("pro-expiry-date");
    localStorage.removeItem("pro-subscription-cancelled");
  }
  window.dispatchEvent(new Event("pro:updated"));
};

export const syncProSubscription = async () => {
  const enabled = isPro();
  if (!enabled) return;

  const details = getProDetails();
  if (!details) return;

  const { planType, expiryDate, isCancelled } = details;

  // Lifetime purchases never expire
  if (planType === "lifetime" || expiryDate === "Never") return;

  const now = new Date();
  const expiry = new Date(expiryDate);
  const oneDayInMs = 24 * 60 * 60 * 1000;
  
  // Calculate if we are on the last day or past expiration
  const msRemaining = expiry.getTime() - now.getTime();
  const isLastDayOrLater = msRemaining <= oneDayInMs;

  if (Capacitor.isNativePlatform()) {
    try {
      // Query current entitlements from Google Play
      const { purchases } = await NativePurchases.getPurchases({ onlyCurrentEntitlements: true });
      const subId = `com.dailyroutiness.app.pro.${planType}`;
      
      // Find matching purchase
      const activePurchase = purchases?.find(
        (p) => p.productIdentifier === subId || p.productIdentifier.includes(planType)
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

        // Check if there is an explicit expirationDate from the native transaction (mainly iOS StoreKit 2)
        if (activePurchase.expirationDate) {
          const storeExpiry = new Date(activePurchase.expirationDate);
          localStorage.setItem("pro-expiry-date", storeExpiry.toISOString());
          
          // If the store expiry is in the past and they cancelled, deactivate Pro
          if (now.getTime() > storeExpiry.getTime() && (storeCancelled || localStorage.getItem("pro-subscription-cancelled") === "1")) {
            setPro(false);
            return;
          }
        } else {
          // Fallback calculation for Android (since expirationDate is not native on Android client SDK)
          if (isLastDayOrLater) {
            // It's the last day or past expiry, but the subscription is STILL active/valid in Google Play.
            // This means it has renewed! Let's update the expiry date to the next cycle.
            const prevExpiry = new Date(expiryDate);
            let newExpiry = "Never";
            
            if (planType === "monthly") {
              newExpiry = new Date(prevExpiry.getTime() + 30 * oneDayInMs).toISOString();
            } else if (planType === "yearly") {
              newExpiry = new Date(prevExpiry.getTime() + 365 * oneDayInMs).toISOString();
            }
            
            localStorage.setItem("pro-expiry-date", newExpiry);
            // If it is active in store, reset cancelled state unless Google says otherwise
            if (activePurchase.willCancel === null) {
              // On Android we assume active since it's active in purchases list
              localStorage.setItem("pro-subscription-cancelled", "0"); 
            }
          }
        }
        window.dispatchEvent(new Event("pro:updated"));
      } else {
        // No longer returned as active entitlement in Google Play/App Store.
        // It has either been cancelled and expired, or cancelled and in paid period.
        // If the calculated paid period has fully lapsed, expire Pro now and rewrite local storage to non-pro.
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
        // Cancelled and fully expired, deactivate Pro and rewrite local storage to non-pro
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



