import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.02e72c743e644d93b48014c13bebd396",
  appName: "Daily Routine OS",
  webDir: "dist",
  server: {
    url: "https://02e72c74-3e64-4d93-b480-14c13bebd396.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  android: {
    backgroundColor: "#fafaf7",
  },
};

export default config;
