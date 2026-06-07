import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { EventProvider } from "./contexts/EventContext";
import { Phase1Provider } from "./contexts/Phase1Context";
import Home from "./pages/Home";
import Planner from "./pages/Planner";
import Dashboard from "./pages/Dashboard";
import Phase1Onboarding from "./pages/Phase1Onboarding";
import Phase1Layout from "./pages/Phase1Layout";
import Phase1ProposalCustomize from "./pages/Phase1ProposalCustomize";
import Phase1ProposalPreview from "./pages/Phase1ProposalPreview";
import Phase1Complete from "./pages/Phase1Complete";
import CoordinatorManagement from "./pages/CoordinatorManagement";
import FinanceDashboard from "./pages/FinanceDashboard";
import SponsorshipDashboard from "./pages/SponsorshipDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import LogisticsDashboard from "./pages/LogisticsDashboard";
import MarketingDashboard from "./pages/MarketingDashboard";
import EmployerDatabase from "./pages/EmployerDatabase";
import EventDashboardSelector from "./pages/EventDashboardSelector";
import LandingPage from "./pages/LandingPage";
import EmployerRegister from "./pages/EmployerRegister";
import JobseekerRegister from "./pages/JobseekerRegister";
import BoothMap from "./pages/BoothMap";
import EmployerLogin from "./pages/EmployerLogin";
import EmployerDashboard from "./pages/EmployerDashboard";
import BossPanel from "./pages/BossPanel";
import PanitiaManagement from "./pages/PanitiaManagement";
import DivisiDashboard from "./pages/DivisiDashboard";
import BoothManagement from "./pages/BoothManagement";
import SuperAdmin from "./pages/SuperAdmin";
import ProposalHub from "./pages/ProposalHub";
import CheckIn from "./pages/CheckIn";
import AbsenPage from "./pages/AbsenPage";
import JobseekerLogin from "./pages/JobseekerLogin";
import JobseekerDashboard from "./pages/JobseekerDashboard";
import SponsorManagement from "./pages/SponsorManagement";
import PostEvent from "./pages/PostEvent";
import BoothMapReport from "./pages/BoothMapReport";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={LandingPage} />
      <Route path={"/employer/register"} component={EmployerRegister} />
      <Route path={"/employer/booth-map"} component={BoothMap} />
      <Route path={"/employer/login"} component={EmployerLogin} />
      <Route path={"/employer/dashboard"} component={EmployerDashboard} />
      <Route path={"/jobseeker/register"} component={JobseekerRegister} />
      <Route path={"/jobseeker/login"} component={JobseekerLogin} />
      <Route path={"/jobseeker/dashboard"} component={JobseekerDashboard} />
      <Route path={"/boss"} component={BossPanel} />
      <Route path={"/boss/denah"} component={BoothMapReport} />
      <Route path={"/panitia"} component={PanitiaManagement} />
      <Route path={"/divisi/:divisi"} component={DivisiDashboard} />
      <Route path={"/booth-management"} component={BoothManagement} />
      <Route path={"/superadmin"} component={SuperAdmin} />
      <Route path={"/proposal"} component={ProposalHub} />
      <Route path={"/checkin"} component={CheckIn} />
      <Route path={"/absen"} component={AbsenPage} />
      <Route path={"/phase1"} component={Phase1Onboarding} />
      <Route path={"/phase1/layout"} component={Phase1Layout} />
      <Route path={"/phase1/proposal-customize"} component={Phase1ProposalCustomize} />
      <Route path={"/phase1/proposal-preview"} component={Phase1ProposalPreview} />
      <Route path={"/phase1/complete"} component={Phase1Complete} />
      <Route path={"/planner"} component={Planner} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/coordinators"} component={CoordinatorManagement} />
      <Route path={"/finance"} component={FinanceDashboard} />
      <Route path={"/sponsorship"} component={SponsorManagement} />
      <Route path={"/post-event"} component={PostEvent} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/logistics"} component={LogisticsDashboard} />
      <Route path={"/marketing"} component={MarketingDashboard} />
      <Route path={"/employers"} component={EmployerDatabase} />
      <Route path={"events"} component={EventDashboardSelector} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <EventProvider>
          <Phase1Provider>
            <TooltipProvider>
              <Toaster position="top-center" />
              <Router />
            </TooltipProvider>
          </Phase1Provider>
        </EventProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
