import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { AdMob, BannerAdSize, BannerAdPosition } from "@capacitor-community/admob";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Info } from "lucide-react";
import { isPro } from "@/lib/pro";

const AD_UNIT_ID = "ca-app-pub-2635018944245510/2699451570";

export const AdMobBannerManager = () => {
  const location = useLocation();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isAdmobInitialized, setIsAdmobInitialized] = useState(false);
  const [isNativeBannerActive, setIsNativeBannerActive] = useState(false);
  const [proActive, setProActive] = useState(() => isPro());

  const isNative = Capacitor.getPlatform() !== "web";

  // Reactive listener to capture live upgrades/restorations of Pro
  useEffect(() => {
    const handleProChange = () => {
      setProActive(isPro());
    };
    window.addEventListener("pro:updated", handleProChange);
    window.addEventListener("storage", handleProChange);
    return () => {
      window.removeEventListener("pro:updated", handleProChange);
      window.removeEventListener("storage", handleProChange);
    };
  }, []);
  
  // Rule: Display the banner ad on all pages except the Home page ("/") if user does NOT have Pro
  const shouldShowAd = location.pathname !== "/" && !proActive;

  // 1. Initialize AdMob on native platforms
  useEffect(() => {
    if (!isNative) return;

    const initAdMob = async () => {
      try {
        await AdMob.initialize({
          requestTrackingAuthorization: true,
        });
        setIsAdmobInitialized(true);
        console.log("AdMob Initialized successfully.");
      } catch (err) {
        console.warn("Failed to initialize AdMob:", err);
      }
    };

    initAdMob();
  }, [isNative]);

  // 2. Keyboard listeners to hide/show banner
  useEffect(() => {
    let nativeWillShowListener: any = null;
    let nativeWillHideListener: any = null;

    // Viewport height comparison fallback for Web/fallback sizing
    let initialHeight = window.innerHeight;
    const handleWebResize = () => {
      if (!isNative) {
        if (initialHeight - window.innerHeight > 150) {
          setIsKeyboardVisible(true);
        } else {
          setIsKeyboardVisible(false);
        }
      }
    };

    if (isNative) {
      // Native keyboard listeners
      try {
        nativeWillShowListener = Keyboard.addListener("keyboardWillShow", () => {
          setIsKeyboardVisible(true);
        });
        nativeWillHideListener = Keyboard.addListener("keyboardWillHide", () => {
          setIsKeyboardVisible(false);
        });
      } catch (err) {
        console.warn("Keyboard plugin listeners failed to register:", err);
      }
    } else {
      window.addEventListener("resize", handleWebResize);
    }

    return () => {
      if (nativeWillShowListener) nativeWillShowListener.remove();
      if (nativeWillHideListener) nativeWillHideListener.remove();
      window.removeEventListener("resize", handleWebResize);
    };
  }, [isNative]);

  // 3. Control Native AdMob banner visibility
  useEffect(() => {
    if (!isNative || !isAdmobInitialized) return;

    const manageNativeBanner = async () => {
      try {
        if (shouldShowAd && !isKeyboardVisible) {
          // Show native AdMob banner
          await AdMob.showBanner({
            adId: AD_UNIT_ID,
            adSize: BannerAdSize.BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            margin: 0,
            isTesting: false,
          });
          setIsNativeBannerActive(true);
          console.log("Native AdMob banner displayed.");
        } else {
          // Hide native AdMob banner
          if (isNativeBannerActive) {
            await AdMob.hideBanner();
            setIsNativeBannerActive(false);
            console.log("Native AdMob banner hidden.");
          }
        }
      } catch (err) {
        console.warn("AdMob banner action failed:", err);
      }
    };

    manageNativeBanner();

    // Clean up banner on route switch to home or unmount
    return () => {
      if (isNativeBannerActive) {
        AdMob.hideBanner().catch(() => {});
      }
    };
  }, [shouldShowAd, isKeyboardVisible, isAdmobInitialized, isNative, isNativeBannerActive]);

  // 4. Inject bottom layout padding to prevent blocking bottom elements/buttons
  useEffect(() => {
    const active = shouldShowAd && !isKeyboardVisible;
    if (active) {
      document.body.classList.add("ad-active-padding");
      document.body.style.paddingBottom = "58px";
    } else {
      document.body.classList.remove("ad-active-padding");
      document.body.style.paddingBottom = "0px";
    }

    return () => {
      document.body.classList.remove("ad-active-padding");
      document.body.style.paddingBottom = "0px";
    };
  }, [shouldShowAd, isKeyboardVisible]);

  // If on web and ad is enabled, render a gorgeous premium mockup ad banner at the bottom
  if (isNative || !shouldShowAd || isKeyboardVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center items-center pointer-events-none p-1"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="w-full max-w-md h-[50px] bg-gradient-to-r from-amber-500/10 via-card to-amber-900/10 border border-border shadow-lg rounded-2xl flex items-center justify-between px-4 pointer-events-auto backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-amber-500/10 text-amber-500">
              <Sparkles size={16} className="animate-pulse" />
            </div>
            <div className="text-left">
              <p className="text-[12px] font-bold text-foreground leading-none">Daily Spark Premium</p>
              <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">Track your habits completely offline.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-amber-500 border border-amber-500/35 px-1.5 py-0.5 rounded uppercase tracking-wider bg-amber-500/5">
              Ad
            </span>
            <Info size={13} className="text-muted-foreground/60 hover:text-foreground cursor-pointer" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
