import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Clock, LogOut, Settings, Film, ChevronRight, Heart, Send, MessageCircle, Download, Smartphone } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMovies } from "@/hooks/useMovies";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { movies } = useMovies();
  const [backdropUrl, setBackdropUrl] = useState<string>("");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if app is already installed
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };
    checkInstalled();

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Get random backdrop from movies
  useEffect(() => {
    const moviesWithBackdrop = movies.filter(m => m.backdrop);
    if (moviesWithBackdrop.length > 0) {
      const randomMovie = moviesWithBackdrop[Math.floor(Math.random() * moviesWithBackdrop.length)];
      setBackdropUrl(randomMovie.backdrop || "");
    }
  }, [movies]);

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to view your profile
            </p>
            <Button onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const menuItems = [
    { icon: Heart, label: "My Watchlist", path: "/watchlist" },
    { icon: Clock, label: "Watch History", path: "/history" },
    { icon: Film, label: "Request a Movie", path: "/request" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <MainLayout>
      {/* Banner Background */}
      <div className="relative h-48 overflow-hidden">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="px-4 pb-24 -mt-16 relative z-10">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-4 border-background shadow-xl">
            <span className="text-3xl font-bold text-primary-foreground">
              {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {user.displayName || "User"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {user.email}
          </p>
          <div className="mt-2">
            <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full">
              Premium Member
            </span>
          </div>
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl overflow-hidden mb-6 border border-border"
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between p-4 hover:bg-muted transition-colors ${
                  index !== menuItems.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-medium text-sm">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </motion.div>

        {/* Install App Button */}
        {!isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl p-4 mb-6 border border-primary/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Install UgaWatch</h3>
                <p className="text-xs text-muted-foreground">Get the full app experience</p>
              </div>
            </div>
            <Button
              onClick={handleInstallClick}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={!deferredPrompt}
            >
              <Download className="w-4 h-4 mr-2" />
              {deferredPrompt ? "Install App" : "Add to Home Screen"}
            </Button>
            {!deferredPrompt && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Use your browser menu to add to home screen
              </p>
            )}
          </motion.div>
        )}

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-4 mb-6 border border-border"
        >
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Join Our Community</h3>
          <div className="flex gap-3">
            <a
              href="https://t.me/devmindsatwork"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0088cc]/20 text-[#0088cc] rounded-lg hover:bg-[#0088cc]/30 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span className="text-sm font-medium">Telegram</span>
            </a>
            <a
              href="https://wa.me/256709728322"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#25D366]/20 text-[#25D366] rounded-lg hover:bg-[#25D366]/30 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">WhatsApp</span>
            </a>
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            className="w-full h-11 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default Profile;
