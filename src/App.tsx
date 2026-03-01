import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TransferModeProvider } from "@/contexts/TransferModeContext";
import { TransferRequestProvider } from "@/contexts/TransferRequestContext";
import { PrivateTrafficProvider } from "@/contexts/PrivateTrafficContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ScrollToTop from "./components/ScrollToTop";
import Landing from "./pages/Landing";
import GuardianLanding from "./pages/GuardianLanding";
import DriverLanding from "./pages/DriverLanding";
import ParamedicLanding from "./pages/ParamedicLanding";
import MapPage from "./pages/MapPage";
import Login from "./pages/Login";
import DriverDashboard from "./pages/DriverDashboard";
import FamilyPage from "./pages/FamilyPage";
import AdminPage from "./pages/AdminPage";
import AdminLogin from "./pages/AdminLogin";
import InstallPage from "./pages/InstallPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import FareCalculatorPage from "./pages/FareCalculatorPage";
import RejectionLogsPage from "./pages/RejectionLogsPage";
import OnboardingPage from "./pages/OnboardingPage";
import MedicineGuidePage from "./pages/MedicineGuidePage";
import EmergencyGuidePage from "./pages/EmergencyGuidePage";
import DriverBidHistoryPage from "./pages/DriverBidHistoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ONBOARDED_KEY = "find-er-onboarded";

const RootRedirect = () => {
  const isOnboarded = localStorage.getItem(ONBOARDED_KEY) === "true";
  return <Navigate to={isOnboarded ? "/landing" : "/onboarding"} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="find-er-theme">
      <TooltipProvider delayDuration={0}>
        <TransferModeProvider>
          <TransferRequestProvider>
            <PrivateTrafficProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<RootRedirect />} />
                  <Route path="/intro" element={<Landing />} />
                  <Route path="/landing" element={<Landing />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/guardian" element={<GuardianLanding />} />
                  <Route path="/driver-intro" element={<DriverLanding />} />
                  <Route path="/paramedic" element={<ParamedicLanding />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/family" element={<FamilyPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/driver" element={<DriverDashboard />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/install" element={<InstallPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                   <Route path="/fare-calculator" element={<FareCalculatorPage />} />
                   <Route path="/logs" element={<RejectionLogsPage />} />
                   <Route path="/driver-bids" element={<DriverBidHistoryPage />} />
                   <Route path="/medicine-guide" element={<MedicineGuidePage />} />
                   <Route path="/emergency-guide" element={<EmergencyGuidePage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </PrivateTrafficProvider>
          </TransferRequestProvider>
        </TransferModeProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
