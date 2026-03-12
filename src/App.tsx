import { lazy, Suspense } from "react";
import AmbulanceLoader from "@/components/AmbulanceLoader";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { TransferModeProvider } from "@/contexts/TransferModeContext";
import { TransferRequestProvider } from "@/contexts/TransferRequestContext";
import { PrivateTrafficProvider } from "@/contexts/PrivateTrafficContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import BottomNavBar from "@/components/BottomNavBar";
import ScrollToTop from "./components/ScrollToTop";
import { useOnboardingSync } from "@/hooks/useOnboardingSync";

// Lazy-loaded pages for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const GuardianLanding = lazy(() => import("./pages/GuardianLanding"));
const DriverLanding = lazy(() => import("./pages/DriverLanding"));
const ParamedicLanding = lazy(() => import("./pages/ParamedicLanding"));
const MapPage = lazy(() => import("./pages/MapPage"));
const Login = lazy(() => import("./pages/Login"));
const DriverDashboard = lazy(() => import("./pages/DriverDashboard"));
const FamilyPage = lazy(() => import("./pages/FamilyPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const FareCalculatorPage = lazy(() => import("./pages/FareCalculatorPage"));
const RejectionLogsPage = lazy(() => import("./pages/RejectionLogsPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const MedicineGuidePage = lazy(() => import("./pages/MedicineGuidePage"));
const EmergencyGuidePage = lazy(() => import("./pages/EmergencyGuidePage"));
const DriverBidHistoryPage = lazy(() => import("./pages/DriverBidHistoryPage"));
const PaymentsPage = lazy(() => import("./pages/PaymentsPage"));
const DriverRegistrationPage = lazy(() => import("./pages/DriverRegistrationPage"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => <AmbulanceLoader variant="fullscreen" />;
const queryClient = new QueryClient();

const ONBOARDED_KEY = "find-er-onboarded";

const RootRedirect = () => {
  const isOnboarded = localStorage.getItem(ONBOARDED_KEY) === "true";
  return <Navigate to={isOnboarded ? "/landing" : "/onboarding"} replace />;
};

const OnboardingSyncWrapper = () => {
  const { useOnboardingSync: sync } = require("@/hooks/useOnboardingSync");
  sync();
  return null;
};

const AppRoutes = () => {
  const location = useLocation();
  const isMapRoute = location.pathname === "/map";

  return (
    <>
      <ScrollToTop />
      <div className={isMapRoute ? "h-[100dvh] overflow-hidden" : "pb-14 sm:pb-0"}>
        <Suspense fallback={<PageLoader />}>
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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/driver" element={<DriverDashboard />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/install" element={<InstallPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/fare-calculator" element={<FareCalculatorPage />} />
            <Route path="/logs" element={<RejectionLogsPage />} />
            <Route path="/driver-bids" element={<DriverBidHistoryPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/driver-registration" element={<DriverRegistrationPage />} />
            <Route path="/medicine-guide" element={<MedicineGuidePage />} />
            <Route path="/emergency-guide" element={<EmergencyGuidePage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
      <BottomNavBar />
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="find-er-theme">
        <TooltipProvider delayDuration={0}>
          <TransferModeProvider>
            <TransferRequestProvider>
              <PrivateTrafficProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </PrivateTrafficProvider>
            </TransferRequestProvider>
          </TransferModeProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
