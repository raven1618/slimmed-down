
import React from "react";
import "./App.css";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { navItems } from "./nav-items";
import AuthLayout from './components/layout/AuthLayout';
import SampleDataDemo from './pages/SampleDataDemo';
import Login from './pages/Login';
import { ResourceProvider } from './context/ResourceContext';
import { AuthProvider } from './context/AuthContext';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <ResourceProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/sample-data-demo" element={<SampleDataDemo />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              {navItems.map(({ to, page }) => (
                <Route 
                  key={to} 
                  path={to} 
                  element={<AuthLayout>{page}</AuthLayout>} 
                />
              ))}
            </Routes>
          </ResourceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
