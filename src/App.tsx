import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useParams } from "react-router-dom";
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
import { BackButtonHandler } from "./components/BackButtonHandler";

const queryClient = new QueryClient();

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
        <BackButtonHandler />
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
          <Route path="/weekly-report" element={<WeeklyReport />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
