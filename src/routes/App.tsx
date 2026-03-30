import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { Toaster } from "@/shared/components/ui/toaster";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { AuthProvider } from "@/shared/hooks/useAuth";
import ProtectedRoute from "@/shared/components/ProtectedRoute";
import Auth from "@/features/auth/Auth";
import Index from "@/features/dashboard/Index";
import Clients from "@/features/clients/Clients";
import ClientWorkspace from "@/features/portal/ClientWorkspace";
import Projects from "@/features/projects/Projects";
import Approvals from "@/features/approvals/Approvals";
import Messages from "@/features/messages/Messages";
import Billing from "@/features/billing/Billing";
import ValueDashboard from "@/features/dashboard/ValueDashboard";
import ClientPortal from "@/features/portal/ClientPortal";
import NotFound from "@/shared/components/NotFound";
import Settings from "@/features/settings/Settings";

import { ThemeProvider } from "next-themes";
import { SpeedInsights } from "@vercel/speed-insights/react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="clientflow-theme" attribute="class">
      <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/portal/:token" element={<ClientPortal />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/clients/:id" element={<ProtectedRoute><ClientWorkspace /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/value" element={<ProtectedRoute><ValueDashboard /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <SpeedInsights />
      </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
