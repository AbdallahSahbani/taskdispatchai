import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Workers from "./pages/Workers";
import Zones from "./pages/Zones";
import WorkerApp from "./pages/WorkerApp";
import Pitch from "./pages/Pitch";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tasks" element={<Index />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/zones" element={<Zones />} />
          <Route path="/analytics" element={<Index />} />
          <Route path="/worker-app" element={<WorkerApp />} />
          <Route path="/pitch" element={<Pitch />} />
          <Route path="/auth" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
