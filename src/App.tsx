import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { PreferencesProvider } from "@/hooks/usePreferences";
import { OfflineQueueProvider } from "@/hooks/useOfflineQueue";
import OfflineBanner from "@/components/OfflineBanner";
import Dashboard from "./pages/Dashboard";
import Items from "./pages/Items";
import ItemDetail from "./pages/ItemDetail";
import ItemForm from "./pages/ItemForm";
import Locations from "./pages/Locations";
import Categories from "./pages/Categories";
import ExpiryPage from "./pages/Warranties";
import Statistics from "./pages/Statistics";
import Finance from "./pages/Finance";
import SettingsPage from "./pages/Settings";
import Auth from "./pages/Auth";
import Landing from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/items" element={<Items />} />
      <Route path="/items/new" element={<ItemForm />} />
      <Route path="/items/:id" element={<ItemDetail />} />
      <Route path="/items/:id/edit" element={<ItemForm />} />
      <Route path="/locations" element={<Locations />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/expiry" element={<ExpiryPage />} />
      <Route path="/warranties" element={<ExpiryPage />} />
      <Route path="/statistics" element={<Statistics />} />
      <Route path="/finance" element={<Finance />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PreferencesProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </PreferencesProvider>
  </QueryClientProvider>
);

export default App;
