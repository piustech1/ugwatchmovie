import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PushNotificationDialog } from "@/components/PushNotificationDialog";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import MovieDetails from "./pages/MovieDetails";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Trending from "./pages/Trending";
import MovieRequest from "./pages/MovieRequest";
import Watchlist from "./pages/Watchlist";
import History from "./pages/History";
import Admin from "./pages/Admin";
import Search from "./pages/Search";
import Settings from "./pages/Settings";
import Category from "./pages/Category";
import Categories from "./pages/Categories";
import AdultZone from "./pages/AdultZone";
import Downloads from "./pages/Downloads";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import Disclaimer from "./pages/legal/Disclaimer";
import Copyright from "./pages/legal/Copyright";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <PushNotificationDialog />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* <Route path="/welcome" element={<Welcome />} /> */}
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/request" element={<MovieRequest />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/history" element={<History />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/search" element={<Search />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/category/:category" element={<Category />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/adult" element={<AdultZone />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/copyright" element={<Copyright />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
