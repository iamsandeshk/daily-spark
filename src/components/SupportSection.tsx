import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Twitter, Share2, Star, ChevronDown, Crown } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { cn } from "@/lib/utils";
import { tapHaptic } from "@/lib/haptics";
import { toast } from "@/hooks/use-toast";
import { isPro } from "@/lib/pro";

// Shared animation config — mirror the routine section open/close transition.
const SECTION_EASE = [0.32, 0.72, 0, 1] as const;
const SECTION_DURATION = 0.45;

const Row = ({
  icon: Icon,
  iconClassName,
  label,
  right,
  onClick,
}: {
  icon: any;
  iconClassName?: string;
  label: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left rounded-xl border border-border bg-card shadow-block transition-colors hover:bg-muted/60 cursor-pointer"
  >
    <Icon size={18} className={cn("shrink-0 text-muted-foreground", iconClassName)} />
    <div className="flex-1 min-w-0 text-[15px] font-medium truncate">{label}</div>
    {right}
  </button>
);

export const SupportSection = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [proEnabled, setProEnabled] = useState<boolean>(() => isPro());

  useEffect(() => {
    const onPro = () => setProEnabled(isPro());
    window.addEventListener("pro:updated", onPro);
    return () => window.removeEventListener("pro:updated", onPro);
  }, []);

  const openExternal = (url: string) => {
    tapHaptic();
    window.open(url, "_blank", "noopener,noreferrer");
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

  // Pro users have a fully unlocked experience — hide Support entirely.
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
              <div className="flex flex-col gap-1.5">
                {/* Get Pro CTA for free users */}
                <Row
                  icon={Crown}
                  label="Get Pro"
                  onClick={() => {
                    tapHaptic();
                    navigate("/settings/pro");
                  }}
                  right={<ChevronDown size={18} className="-rotate-90 text-muted-foreground shrink-0" />}
                />

                <Row
                  icon={Twitter}
                  label="Follow on X"
                  onClick={() => openExternal("https://x.com/sandeshkullolli")}
                />
                <Row
                  icon={Star}
                  label="Rate on Play Store"
                  onClick={() => openExternal("https://play.google.com/store/apps/details?id=com.dailyroutiness.app")}
                />
                <Row
                  icon={Share2}
                  label="Share the app"
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
