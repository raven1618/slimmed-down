
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
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
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
                path="/dispatch" 
                element={
                  <AuthLayout requiredRoles={['admin', 'dispatcher']}>
                    <Dispatch />
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
);

export default App;
