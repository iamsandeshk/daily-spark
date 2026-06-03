import { useEffect, useState } from "react";
import { Heart, Clapperboard, Twitter, Share2, Star, Check } from "lucide-react";
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

// Replace with a real AdMob Rewarded ad unit before release.
const REWARD_AD_UNIT_ID = "ca-app-pub-2635018944245510/2699451570";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-bold px-1 mt-7 mb-2.5">
    {children}
  </h3>
);

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
  const [proEnabled, setProEnabled] = useState<boolean>(() => isPro());
  const [adsFreeUntil, setAdsFreeUntil] = useState<number>(() => getAdsDisabledUntil());

  useEffect(() => {
    const onPro = () => {
      setProEnabled(isPro());
      setAdsFreeUntil(getAdsDisabledUntil());
    };
    window.addEventListener("pro:updated", onPro);
    return () => window.removeEventListener("pro:updated", onPro);
  }, []);

  const openExternal = (url: string) => {
    tapHaptic();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const formatAdsFreeLeft = () => {
    const ms = adsFreeUntil - Date.now();
    if (ms <= 0) return "";
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins}m left`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem ? `${hrs}h ${rem}m left` : `${hrs}h left`;
  };

  const handleWatchAd = async () => {
    tapHaptic();
    if (isPro()) {
      toast({ title: "You're Pro", description: "You already have an ad-free experience." });
      return;
    }
    if (areAdsTemporarilyDisabled()) {
      toast({ title: "Ads already disabled", description: formatAdsFreeLeft() });
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

  const adsFreeActive = !proEnabled && adsFreeUntil > Date.now();

  return (
    <div className="mt-2">
      {/* Divider above Support */}
      <div className="border-t border-border" />

      <SectionLabel>Support the developer</SectionLabel>
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
              ? `Ad-free active · ${formatAdsFreeLeft()}`
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
  );
};
