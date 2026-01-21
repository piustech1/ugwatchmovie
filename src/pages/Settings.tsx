import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  HelpCircle, 
  MessageCircle, 
  Send, 
  LogOut,
  ChevronRight,
  Smartphone,
  Globe,
  Info,
  BellRing
} from "lucide-react";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { permission, isSupported, requestPermission, isEnabled } = usePushNotifications();
  const [autoPlay, setAutoPlay] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleEnablePush = async () => {
    await requestPermission();
  };

  const settingsGroups = [
    {
      title: "Notifications",
      items: [
        {
          icon: BellRing,
          label: "Push Notifications",
          description: isEnabled ? "Enabled - You'll receive alerts" : "Enable to get notified about new content",
          action: isSupported ? (
            <Switch 
              checked={isEnabled} 
              onCheckedChange={handleEnablePush}
              disabled={isEnabled}
            />
          ) : (
            <span className="text-xs text-muted-foreground">Not supported</span>
          ),
        },
        {
          icon: Smartphone,
          label: "Auto-Play Videos",
          description: "Videos start automatically",
          action: <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />,
        },
      ],
    },
    {
      title: "Community",
      items: [
        {
          icon: Send,
          label: "Telegram Channel",
          description: "@devmindsatwork",
          onClick: () => window.open("https://t.me/devmindsatwork", "_blank"),
        },
        {
          icon: MessageCircle,
          label: "WhatsApp Support",
          description: "Contact developer",
          onClick: () => window.open("https://wa.me/256709728322", "_blank"),
        },
      ],
    },
    {
      title: "Trust & Legal",
      items: [
        {
          icon: Shield,
          label: "Privacy Policy",
          onClick: () => navigate("/privacy"),
        },
        {
          icon: Info,
          label: "Terms of Service",
          onClick: () => navigate("/terms"),
        },
        {
          icon: HelpCircle,
          label: "Disclaimer",
          onClick: () => navigate("/disclaimer"),
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          icon: Info,
          label: "App Version",
          description: "UgaWatch v1.0.0",
        },
        {
          icon: Shield,
          label: "Copyright Notice",
          onClick: () => navigate("/copyright"),
        },
      ],
    },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen pt-16 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-4 border-b border-border">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>

        {/* Settings Groups */}
        <div className="px-4 py-6 space-y-6">
          {settingsGroups.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {group.title}
              </h2>
              <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
                {group.items.map((item, itemIndex) => (
                  <div
                    key={item.label}
                    onClick={item.onClick}
                    className={`flex items-center justify-between p-4 ${
                      item.onClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </div>
                    {item.action || (item.onClick && <ChevronRight className="w-5 h-5 text-muted-foreground" />)}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Logout Button */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-4 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Log Out</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
