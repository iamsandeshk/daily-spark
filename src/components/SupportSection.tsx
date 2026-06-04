import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Clapperboard, Twitter, Share2, Star, Check, ChevronDown, Crown, Timer } from "lucide-react";
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

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card overflow-hidden">{children}</div>
);

const Row = ({
  icon: Icon,
  label,
  hint,
  right,
  onClick,
  last,
}: {
  icon: any;
  label: string;
  hint?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  last?: boolean;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/60 cursor-pointer",
      !last && "border-b border-border"
    )}
  >
    <Icon size={18} className="shrink-0 text-muted-foreground" />
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

  const handleWatchAd = async () => {
    tapHaptic();
    if (isPro()) {
      toast({ title: "You're Pro", description: "You already have an ad-free experience." });
      return;
    }
    if (areAdsTemporarilyDisabled()) {
      toast({ title: "Ads already disabled", description: `${formatCountdown()} left` });
      return;
    }

    if (Capacitor.getPlatform() !== "web") {
      try {
        let rewarded = false;
        const earnedListener = await AdMob.addListener(
          RewardAdPluginEvents.Rewarded,
          () => {
            rewarded = true;
          }
        );
        await AdMob.prepareRewardVideoAd({ adId: REWARD_AD_UNIT_ID });
        await AdMob.showRewardVideoAd();
        await earnedListener.remove();
        if (rewarded) {
          disableAdsForHours(4);
          setAdsFreeUntil(getAdsDisabledUntil());
          setNow(Date.now());
          successHaptic();
          toast({ title: "Ads disabled for 4 hours", description: "Thanks for supporting the app!" });
        }
      } catch (err) {
        console.warn("Reward ad failed:", err);
        toast({ title: "Couldn't load ad", description: "Please try again in a moment." });
      }
      return;
    }

    // Web fallback — grant the reward directly
    disableAdsForHours(4);
    setAdsFreeUntil(getAdsDisabledUntil());
    setNow(Date.now());
    successHaptic();
    toast({ title: "Ads disabled for 4 hours", description: "Thanks for supporting the app!" });
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

  return (
    <section className="flex flex-col mt-6">
      {/* Divider above Support */}
      <div className="border-t border-border mb-3" />

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

              <Card>
                <Row
                  icon={Heart}
                  label="Donate to the developer"
                  hint="Buy me a coffee to keep updates coming"
                  onClick={() => openExternal("https://buymeacoffee.com/sandeshkullolli")}
                />
                <Row
                  icon={Clapperboard}
                  label="Watch an ad — go ad-free 4 hrs"
                  hint={
                    adsFreeActive
                      ? `Ad-free active · ${formatCountdown()} left`
                      : "Support the app and remove ads temporarily"
                  }
                  right={adsFreeActive ? <Check size={18} className="text-accent shrink-0" /> : undefined}
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
                  last
                />
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
