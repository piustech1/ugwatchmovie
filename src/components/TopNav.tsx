import { Search, Film, Bell, Lock, Home, TrendingUp, Download, User, Menu } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const desktopNavItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: TrendingUp, label: "Trending", path: "/trending" },
  { icon: Download, label: "Downloads", path: "/downloads" },
  { icon: User, label: "Profile", path: "/profile" },
];

const TopNav = () => {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/95 to-transparent backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl md:text-2xl font-bold">
            <span className="text-foreground">Uga</span>
            <span className="text-primary neon-text">Watch</span>
          </span>
        </Link>

        {/* Desktop Navigation - Center */}
        {!isMobile && (
          <nav className="hidden md:flex items-center gap-1">
            {desktopNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <button
            onClick={() => navigate("/search")}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-foreground" />
          </button>

          {/* Notifications with Badge */}
          <button
            onClick={() => navigate("/notifications")}
            className="p-2 rounded-full hover:bg-muted transition-colors relative"
            aria-label="Notifications"
          >
            <motion.div
              animate={unreadCount > 0 ? { 
                rotate: [0, -10, 10, -10, 10, 0],
              } : {}}
              transition={{ 
                duration: 0.5, 
                repeat: unreadCount > 0 ? Infinity : 0,
                repeatDelay: 3
              }}
            >
              <Bell className="w-5 h-5 text-foreground" />
            </motion.div>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </button>

          {/* Movie Request - Desktop only or dropdown on mobile */}
          {!isMobile && (
            <button
              onClick={() => navigate("/request")}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Request Movie"
            >
              <Film className="w-5 h-5 text-foreground" />
            </button>
          )}

          {/* Adult Zone */}
          <button
            onClick={() => navigate("/adult")}
            className="p-2 rounded-full hover:bg-muted transition-colors relative"
            aria-label="Adult Zone"
          >
            <Lock className="w-5 h-5 text-red-400" />
          </button>

          {/* More Menu for Mobile */}
          {isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-full hover:bg-muted transition-colors">
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/request")}>
                  <Film className="w-4 h-4 mr-2" />
                  Request Movie
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/categories")}>
                  Categories
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
