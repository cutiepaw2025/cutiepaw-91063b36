import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthPage } from "./pages/auth/AuthPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CompanySetup from "./pages/settings/CompanySetup";
import ProductCategoryMaster from "./pages/masters/ProductCategoryMaster";
import FabricMaster from "./pages/masters/FabricMaster";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Index />} />
            <Route path="settings/company" element={<CompanySetup />} />
            <Route path="masters/categories" element={<ProductCategoryMaster />} />
            <Route path="masters/fabrics" element={<FabricMaster />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
