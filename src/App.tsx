import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useParams, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import RoutineDetail from "./pages/RoutineDetail.tsx";
import RoutineSettings from "./pages/RoutineSettings.tsx";
import History from "./pages/History.tsx";
import Settings from "./pages/Settings.tsx";
import WeeklyReport from "./pages/WeeklyReport.tsx";
import Templates from "./pages/Templates.tsx";
import Archived from "./pages/Archived.tsx";
import ToolbarCustomization from "./pages/ToolbarCustomization.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import Pro from "./pages/Pro.tsx";
import Insights from "./pages/Insights.tsx";
import Customization from "./pages/Customization.tsx";
import { BackButtonHandler } from "./components/BackButtonHandler";
import { AdMobBannerManager } from "./components/AdMobBannerManager";
import { syncProSubscription } from "@/lib/pro";

const queryClient = new QueryClient();

const SubscriptionSyncInit = () => {
  useEffect(() => {
    syncProSubscription();
  }, []);
  return null;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const RoutineDetailRoute = () => {
  const { id } = useParams();
  return <RoutineDetail key={id} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <SubscriptionSyncInit />
        <BackButtonHandler />
        <AdMobBannerManager />

        <Routes>
        <Route path="/" element={<Index />} />
          <Route path="/routine/:id" element={<RoutineDetailRoute />} />
          <Route path="/routine/:id/settings" element={<RoutineSettings />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/templates" element={<Templates />} />
          <Route path="/settings/archived" element={<Archived />} />
          <Route path="/settings/toolbar" element={<ToolbarCustomization />} />
          <Route path="/settings/privacy" element={<PrivacyPolicy />} />
          <Route path="/settings/pro" element={<Pro />} />
          <Route path="/settings/customization" element={<Customization />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/weekly-report" element={<WeeklyReport />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
