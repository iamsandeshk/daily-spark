import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Clapperboard, Twitter, Share2, Star, Check, ChevronDown, Crown, Timer, Loader2, AlertCircle, WifiOff } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { AdMob, RewardAdPluginEvents } from "@capacitor-community/admob";
import { cn } from "@/lib/utils";
import { tapHaptic, successHaptic } from "@/lib/haptics";
import { toast } from "@/hooks/use-toast";
import {
  isPro,
  areAdsTemporarilyDisabled,
  getAdsDisabledUntil,
  disableAdsForHours,
} from "@/lib/pro";

// Shared animation config — mirror the routine section open/close transition.
const SECTION_EASE = [0.32, 0.72, 0, 1] as const;
const SECTION_DURATION = 0.45;

// Replace with a real AdMob Rewarded ad unit before release.
const REWARD_AD_UNIT_ID = "ca-app-pub-2635018944245510/2699451570";

// Automatic retry policy for a failed rewarded ad load.
const MAX_AUTO_RETRIES = 3;
const BACKOFF_SECONDS = [5, 15, 30]; // exponential-ish backoff per attempt

type AdState = "idle" | "loading" | "retrying" | "success" | "error" | "offline";

const Row = ({
  icon: Icon,
  iconClassName,
  label,
  hint,
  right,
  onClick,
}: {
  icon: any;
  iconClassName?: string;
  label: string;
  hint?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  last?: boolean;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3.5 py-3 text-left rounded-xl border border-border bg-card shadow-block transition-colors hover:bg-muted/60 cursor-pointer"
  >
    <Icon size={18} className={cn("shrink-0 text-muted-foreground", iconClassName)} />
    <div className="flex-1 min-w-0">
      <div className="text-[15px] font-medium truncate">{label}</div>
      {hint && <div className="text-[12px] text-muted-foreground truncate">{hint}</div>}
    </div>
    {right}
  </button>
);

export const SupportSection = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [proEnabled, setProEnabled] = useState<boolean>(() => isPro());
  const [adsFreeUntil, setAdsFreeUntil] = useState<number>(() => getAdsDisabledUntil());
  const [now, setNow] = useState<number>(() => Date.now());
  const [adState, setAdState] = useState<AdState>("idle");
  const [retryIn, setRetryIn] = useState<number>(0);

  // Refs used inside async flows / timers to avoid stale closures.
  const attemptRef = useRef(0);
  const cancelledRef = useRef(false);
  const retryTimerRef = useRef<number | undefined>(undefined);
  const countdownTimerRef = useRef<number | undefined>(undefined);
  const adStateRef = useRef<AdState>("idle");
  adStateRef.current = adState;

  useEffect(() => {
    const onPro = () => {
      setProEnabled(isPro());
      setAdsFreeUntil(getAdsDisabledUntil());
    };
    window.addEventListener("pro:updated", onPro);
    return () => window.removeEventListener("pro:updated", onPro);
  }, []);

  // Live ticking countdown while the temporary ad-free window is active.
  const adsFreeActive = !proEnabled && adsFreeUntil > now;
  useEffect(() => {
    if (!adsFreeActive) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [adsFreeActive]);

  const clearAdTimers = () => {
    if (retryTimerRef.current !== undefined) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = undefined;
    }
    if (countdownTimerRef.current !== undefined) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = undefined;
    }
  };

  // Detect network changes. If we recover while showing the offline state,
  // gently reset back to idle so the user can retry.
  useEffect(() => {
    const onOnline = () => {
      if (adStateRef.current === "offline") setAdState("idle");
    };
    const onOffline = () => {
      if (adStateRef.current === "loading" || adStateRef.current === "retrying") {
        clearAdTimers();
        setAdState("offline");
      }
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Cleanup any pending retry timers when the component unmounts.
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      clearAdTimers();
    };
  }, []);

  const openExternal = (url: string) => {
    tapHaptic();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Full H:MM:SS countdown for the ad-free window.
  const formatCountdown = () => {
    const ms = Math.max(0, adsFreeUntil - now);
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const grantReward = () => {
    disableAdsForHours(4);
    setAdsFreeUntil(getAdsDisabledUntil());
    setNow(Date.now());
    setAdState("success");
    successHaptic();
    toast({ title: "Ads disabled for 4 hours", description: "Thanks for supporting the app!" });
    // Reset back to idle once the success state has been shown briefly.
    window.setTimeout(() => {
      if (!cancelledRef.current) setAdState("idle");
    }, 2500);
  };

  // Show a rewarded ad. Resolves to true if the reward was earned, false if the
  // user dismissed early. Throws if the ad fails to load/show.
  const showRewardedAd = async (): Promise<boolean> => {
    if (Capacitor.getPlatform() !== "web") {
      let rewarded = false;
      const earnedListener = await AdMob.addListener(
        RewardAdPluginEvents.Rewarded,
        () => {
          rewarded = true;
        }
      );
      try {
        await AdMob.prepareRewardVideoAd({ adId: REWARD_AD_UNIT_ID });
        await AdMob.showRewardVideoAd();
      } finally {
        await earnedListener.remove();
      }
      return rewarded;
    }
    // Web fallback — simulate a short load, then grant the reward directly.
    await new Promise((res) => setTimeout(res, 1200));
    return true;
  };

  // Decide whether to auto-retry (with backoff) or surface a manual error state.
  const scheduleRetryOrFail = (err?: unknown) => {
    if (err) console.warn("Reward ad failed:", err);

    // No connection → dedicated offline state, no auto-retry.
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setAdState("offline");
      return;
    }

    const next = attemptRef.current + 1;
    attemptRef.current = next;

    if (next > MAX_AUTO_RETRIES) {
      setAdState("error");
      toast({ title: "Couldn't load ad", description: "Please try again in a little while." });
      return;
    }

    const wait = BACKOFF_SECONDS[Math.min(next - 1, BACKOFF_SECONDS.length - 1)];
    setRetryIn(wait);
    setAdState("retrying");

    clearAdTimers();
    countdownTimerRef.current = window.setInterval(() => {
      setRetryIn((s) => (s > 1 ? s - 1 : 0));
    }, 1000);
    retryTimerRef.current = window.setTimeout(() => {
      clearAdTimers();
      if (!cancelledRef.current) runAd();
    }, wait * 1000);
  };

  // Core attempt — load + show the ad, handling reward / dismissal / failure.
  const runAd = async () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setAdState("offline");
      return;
    }
    setAdState("loading");
    try {
      const rewarded = await showRewardedAd();
      if (cancelledRef.current) return;
      if (rewarded) {
        attemptRef.current = 0;
        grantReward();
      } else {
        attemptRef.current = 0;
        setAdState("idle");
        toast({ title: "Ad not finished", description: "Watch the full ad to go ad-free." });
      }
    } catch (err) {
      if (cancelledRef.current) return;
      scheduleRetryOrFail(err);
    }
  };

  // Tap handler — also serves as "Retry now" for offline/error/retrying states.
  const handleWatchAd = () => {
    tapHaptic();
    if (adState === "loading") return;
    if (isPro()) {
      toast({ title: "You're Pro", description: "You already have an ad-free experience." });
      return;
    }
    if (areAdsTemporarilyDisabled()) {
      toast({ title: "Ads already disabled", description: `${formatCountdown()} left` });
      return;
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setAdState("offline");
      toast({ title: "No internet connection", description: "Connect to a network to watch an ad." });
      return;
    }

    // Manual (re)start — reset the retry counter and any pending timers.
    clearAdTimers();
    cancelledRef.current = false;
    attemptRef.current = 0;
    runAd();
  };

  const handleShareApp = async () => {
    tapHaptic();
    const shareData = {
      title: "Daily Routines",
      text: "Check out Daily Routines — a simple, beautiful habit & routine tracker.",
      url: "https://play.google.com/store/apps/details?id=com.dailyroutiness.app",
    };
    try {
      if (Capacitor.getPlatform() !== "web") {
        await Share.share(shareData);
      } else if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast({ title: "Link copied", description: "Share it with your friends!" });
      }
    } catch {
      /* user cancelled */
    }
  };

  // Dynamic icon, label, hint and trailing element for the Watch-an-ad row.
  const watchAdIcon =
    adState === "loading" || adState === "retrying"
      ? Loader2
      : adState === "offline"
        ? WifiOff
        : adState === "error"
          ? AlertCircle
          : adState === "success"
            ? Check
            : Clapperboard;

  const watchAdLabel =
    adState === "loading"
      ? "Loading ad…"
      : adState === "retrying"
        ? `Retrying in ${retryIn}s…`
        : adState === "offline"
          ? "You're offline"
          : adState === "error"
            ? "Couldn't load ad"
            : adState === "success"
              ? "Ads disabled for 4 hours"
              : "Watch an ad — go ad-free 4 hrs";

  const watchAdHint =
    adState === "loading"
      ? "Please wait a moment"
      : adState === "retrying"
        ? "Connection issue — retrying automatically. Tap to retry now."
        : adState === "offline"
          ? "Connect to the internet, then tap retry"
          : adState === "error"
            ? "Tap to try again"
            : adsFreeActive
              ? `Ad-free active · ${formatCountdown()} left`
              : "Support the app and remove ads temporarily";

  const RetryPill = ({ label }: { label: string }) => (
    <span className="shrink-0 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[12px] font-bold text-accent">
      {label}
    </span>
  );

  let watchAdRight: React.ReactNode = undefined;
  if (adState === "offline" || adState === "error") {
    watchAdRight = <RetryPill label="Retry" />;
  } else if (adState === "retrying") {
    watchAdRight = <RetryPill label="Retry now" />;
  } else if (adsFreeActive) {
    watchAdRight = <Check size={18} className="text-accent shrink-0" />;
  }

  // Pro users have an ad-free, fully unlocked experience — hide Support entirely.
  if (proEnabled) return null;

  return (
    <section className="flex flex-col mt-9 relative pt-7">
      {/* Faded divider above Support (matches the Template Library divider) */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      <header className="flex items-center gap-2 px-1">
        <button
          onClick={() => {
            tapHaptic();
            setCollapsed((v) => !v);
          }}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <motion.span
            animate={{ rotate: collapsed ? -90 : 0 }}
            transition={{ duration: SECTION_DURATION, ease: SECTION_EASE }}
            className="text-muted-foreground"
          >
            <ChevronDown size={16} />
          </motion.span>
          <h2 className="text-base font-semibold tracking-tight truncate">Support the developer</h2>
        </button>
      </header>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: SECTION_DURATION, ease: SECTION_EASE },
              opacity: { duration: SECTION_DURATION, ease: SECTION_EASE },
            }}
            style={{ overflow: "hidden" }}
          >
            <div className="pt-3">
              {/* Ad-free countdown banner */}
              {adsFreeActive && (
                <div className="mb-3 flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3">
                  <Timer size={18} className="shrink-0 text-accent" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-foreground">Ad-free active</div>
                    <div className="text-[12px] text-muted-foreground">Enjoy a clean, ad-free experience</div>
                  </div>
                  <div className="font-mono text-[15px] font-bold tabular-nums text-accent">
                    {formatCountdown()}
                  </div>
                </div>
              )}

              {/* Get Pro CTA for free users */}
              {!proEnabled && (
                <button
                  onClick={() => {
                    tapHaptic();
                    navigate("/settings/pro");
                  }}
                  className="mb-3 w-full flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-card to-amber-900/10 px-4 py-3.5 text-left transition-colors hover:from-amber-500/25"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-amber-500/15 text-amber-500 shrink-0">
                    <Crown size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-foreground">Get Pro</div>
                    <div className="text-[12px] text-muted-foreground truncate">
                      Remove ads forever and unlock everything
                    </div>
                  </div>
                  <ChevronDown size={18} className="-rotate-90 text-muted-foreground shrink-0" />
                </button>
              )}

              <div className="flex flex-col gap-1.5">
                <Row
                  icon={watchAdIcon}
                  iconClassName={cn(
                    (adState === "loading" || adState === "retrying") && "animate-spin text-foreground",
                    adState === "offline" && "text-destructive",
                    adState === "error" && "text-destructive",
                    adState === "success" && "text-accent"
                  )}
                  label={watchAdLabel}
                  hint={watchAdHint}
                  right={watchAdRight}
                  onClick={handleWatchAd}
                />
                <Row
                  icon={Twitter}
                  label="Follow on X"
                  hint="Get updates and behind-the-scenes"
                  onClick={() => openExternal("https://x.com/sandeshkullolli")}
                />
                <Row
                  icon={Star}
                  label="Rate on Play Store"
                  hint="A 5-star review means the world"
                  onClick={() => openExternal("https://play.google.com/store/apps/details?id=com.dailyroutiness.app")}
                />
                <Row
                  icon={Share2}
                  label="Share the app"
                  hint="Tell a friend who'd love it"
                  onClick={handleShareApp}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
