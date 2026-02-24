import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Workers from "./pages/Workers";
import Zones from "./pages/Zones";
import WorkerApp from "./pages/WorkerApp";
import Pitch from "./pages/Pitch";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/pitch" element={<Pitch />} />

            {/* Manager-only routes */}
            <Route path="/" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/tasks" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/workers" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <Workers />
              </ProtectedRoute>
            } />
            <Route path="/zones" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <Zones />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <Index />
              </ProtectedRoute>
            } />

            {/* Employee-only routes */}
            <Route path="/worker-app" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <WorkerApp />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
