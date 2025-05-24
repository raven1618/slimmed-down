

import React from "react";
import "./App.css";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import AuthLayout from './components/layout/AuthLayout';
import SampleDataDemo from './pages/SampleDataDemo';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/sample-data-demo" element={<SampleDataDemo />} />
          <Route path="/" element={<AuthLayout />}>
            {navItems.map(({ to, page }) => (
              <Route key={to} path={to === "/" ? "index" : to.replace("/", "")} element={page} />
            ))}
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

