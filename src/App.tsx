import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Landing from "./pages/Landing";
import GuardianLanding from "./pages/GuardianLanding";
import DriverLanding from "./pages/DriverLanding";
import MapPage from "./pages/MapPage";
import Login from "./pages/Login";
import DriverDashboard from "./pages/DriverDashboard";
import FamilyPage from "./pages/FamilyPage";
import AdminPage from "./pages/AdminPage";
import InstallPage from "./pages/InstallPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import FareCalculatorPage from "./pages/FareCalculatorPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/guardian" element={<GuardianLanding />} />
          <Route path="/driver-intro" element={<DriverLanding />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/family" element={<FamilyPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/install" element={<InstallPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/fare-calculator" element={<FareCalculatorPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
