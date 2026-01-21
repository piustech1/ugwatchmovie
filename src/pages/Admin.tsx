import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Film, 
  Tv, 
  Users, 
  Bell, 
  Menu, 
  X,
  Plus,
  MessageSquare,
  Settings,
  User,
  List,
  LogOut,
} from "lucide-react";
import AdminAddMovie from "@/components/admin/AdminAddMovie";
import AdminAddSeries from "@/components/admin/AdminAddSeries";
import AdminManageMovies from "@/components/admin/AdminManageMovies";
import AdminManageSeries from "@/components/admin/AdminManageSeries";
import AdminManageVJs from "@/components/admin/AdminManageVJs";
import AdminNotifications from "@/components/admin/AdminNotifications";
import AdminRequests from "@/components/admin/AdminRequests";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminLogin from "@/components/admin/AdminLogin";
import { Button } from "@/components/ui/button";

type AdminSection = "dashboard" | "add-movie" | "add-series" | "manage-movies" | "manage-series" | "manage-vjs" | "requests" | "notifications" | "users" | "settings";

const Admin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if admin is already authenticated
  useEffect(() => {
    const authenticated = sessionStorage.getItem("adminAuthenticated") === "true";
    setIsAuthenticated(authenticated);
    setCheckingAuth(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuthenticated");
    sessionStorage.removeItem("adminLoginTime");
    setIsAuthenticated(false);
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "add-movie", icon: Plus, label: "Add Movie" },
    { id: "add-series", icon: Tv, label: "Add Series" },
    { id: "manage-movies", icon: Film, label: "Manage Movies" },
    { id: "manage-series", icon: List, label: "Manage Series" },
    { id: "manage-vjs", icon: User, label: "Manage VJs" },
    { id: "requests", icon: MessageSquare, label: "Movie Requests" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "users", icon: Users, label: "Users" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "add-movie":
        return <AdminAddMovie isSeries={false} />;
      case "add-series":
        return <AdminAddSeries />;
      case "manage-movies":
        return <AdminManageMovies />;
      case "manage-series":
        return <AdminManageSeries />;
      case "manage-vjs":
        return <AdminManageVJs />;
      case "requests":
        return <AdminRequests />;
      case "notifications":
        return <AdminNotifications />;
      case "users":
        return <AdminUsers />;
      case "settings":
        return <AdminSettings />;
      default:
        return <AdminDashboard setActiveSection={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-muted rounded-lg">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <span className="font-bold text-foreground">
            UgaWatch <span className="text-primary">ADMIN</span>
          </span>
          <div className="w-9" />
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-lg font-bold text-foreground">
            UGA<span className="text-primary">WATCH</span>
          </span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-muted rounded-lg">
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id as AdminSection);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </aside>
      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Admin;
