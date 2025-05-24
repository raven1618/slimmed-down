import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ResourceProvider } from "@/context/ResourceContext";
import AuthLayout from "@/components/layout/AuthLayout";
import LoadingScreen from "@/components/layout/LoadingScreen";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Operations from "./pages/Operations";
import PatientCases from "./pages/PatientCases";
import PatientCaseDetail from "./pages/PatientCaseDetail";
import Dispatch from "./pages/Dispatch";
import Fleet from "./pages/Fleet";
import Schedule from "./pages/Schedule";
import Facilities from "./pages/Facilities";
import FacilityDetail from "./pages/FacilityDetail";
import Crew from "./pages/Crew";
import Authorizations from "./pages/Authorizations";
import AuthorizationDetail from "./pages/AuthorizationDetail";
import Tasks from "./pages/Tasks";
import Billing from "./pages/Billing";
import Performance from "./pages/Performance";
import Settings from "./pages/Settings";
import Contacts from "./pages/Contacts";
import Deals from "./pages/Deals";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <ResourceProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route element={<AuthLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/operations" element={<Operations />} />
                  <Route path="/patient-cases" element={<PatientCases />} />
                  <Route path="/patient-cases/:id" element={<PatientCaseDetail />} />
                  <Route path="/dispatch" element={<Dispatch />} />
                  <Route path="/fleet" element={<Fleet />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/facilities" element={<Facilities />} />
                  <Route path="/facilities/:id" element={<FacilityDetail />} />
                  <Route path="/crew" element={<Crew />} />
                  <Route path="/authorizations" element={<Authorizations />} />
                  <Route path="/authorizations/:id" element={<AuthorizationDetail />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/performance" element={<Performance />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/deals" element={<Deals />} />
                </Route>
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </ResourceProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
