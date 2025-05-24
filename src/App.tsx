
import React, { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import LoadingScreen from './components/layout/LoadingScreen';
import AuthLayout from './components/layout/AuthLayout';

// Lazy loaded pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const PatientCases = lazy(() => import('./pages/PatientCases'));
const PatientCaseDetail = lazy(() => import('./pages/PatientCaseDetail'));
const Dispatch = lazy(() => import('./pages/Dispatch'));
const Facilities = lazy(() => import('./pages/Facilities'));
const FacilityDetail = lazy(() => import('./pages/FacilityDetail'));
const Crew = lazy(() => import('./pages/Crew'));
const Authorizations = lazy(() => import('./pages/Authorizations'));
const AuthorizationDetail = lazy(() => import('./pages/AuthorizationDetail'));
const Performance = lazy(() => import('./pages/Performance'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Billing = lazy(() => import('./pages/Billing'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
});

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Something went wrong</h2>
            <p className="text-gray-500 mb-6">Please refresh the page to try again</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <AuthLayout>
                      <Dashboard />
                    </AuthLayout>
                  } 
                />
                
                <Route 
                  path="/patient-cases" 
                  element={
                    <AuthLayout>
                      <PatientCases />
                    </AuthLayout>
                  } 
                />
                
                <Route 
                  path="/patient-cases/:id" 
                  element={
                    <AuthLayout>
                      <PatientCaseDetail />
                    </AuthLayout>
                  } 
                />
                
                <Route 
                  path="/dispatch" 
                  element={
                    <AuthLayout requiredRoles={['admin', 'dispatcher']}>
                      <Dispatch />
                    </AuthLayout>
                  } 
                />
                
                <Route 
                  path="/facilities" 
                  element={
                    <AuthLayout requiredRoles={['admin', 'dispatcher', 'client']}>
                      <Facilities />
                    </AuthLayout>
                  } 
                />
                
                <Route 
                  path="/facilities/:id" 
                  element={
                    <AuthLayout requiredRoles={['admin', 'dispatcher', 'client']}>
                      <FacilityDetail />
                    </AuthLayout>
                  } 
                />
                
                <Route 
                  path="/crew" 
                  element={
                    <AuthLayout requiredRoles={['admin', 'dispatcher']}>
                      <Crew />
                    </AuthLayout>
                  } 
                />
                
                <Route 
                  path="/authorizations" 
                  element={
                    <AuthLayout requiredRoles={['admin', 'billing']}>
                      <Authorizations />
                    </AuthLayout>
                  } 
                />
                
                <Route 
                  path="/authorizations/:id" 
                  element={
                    <AuthLayout requiredRoles={['admin', 'billing']}>
                      <AuthorizationDetail />
                    </AuthLayout>
                  } 
                />
                
                <Route 
                  path="/tasks" 
                  element={
                    <AuthLayout>
                      <Tasks />
                    </AuthLayout>
                  } 
                />
                
                <Route 
                  path="/billing" 
                  element={
                    <AuthLayout requiredRoles={['admin', 'billing']}>
                      <Billing />
                    </AuthLayout>
                  } 
                />
                
                <Route 
                  path="/performance" 
                  element={
                    <AuthLayout requiredRoles={['admin']}>
                      <Performance />
                    </AuthLayout>
                  } 
                />
                
                <Route 
                  path="/settings" 
                  element={
                    <AuthLayout>
                      <Settings />
                    </AuthLayout>
                  } 
                />
                
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
