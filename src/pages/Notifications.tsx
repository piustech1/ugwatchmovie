import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Film, Tv, Megaphone, Gift, RefreshCw, Check, ChevronRight, Newspaper } from "lucide-react";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { useNotifications } from "@/hooks/useNotifications";

const getNotificationIcon = (type?: string) => {
  switch (type) {
    case "new_movie":
      return { icon: Film, color: "from-blue-500 to-purple-500" };
    case "new_series":
      return { icon: Tv, color: "from-orange-500 to-amber-500" };
    case "update":
      return { icon: RefreshCw, color: "from-orange-500 to-yellow-500" };
    case "promo":
      return { icon: Gift, color: "from-purple-500 to-indigo-500" };
    case "news":
      return { icon: Newspaper, color: "from-blue-500 to-cyan-500" };
    case "announcement":
    default:
      return { icon: Megaphone, color: "from-pink-500 to-red-500" };
  }
};

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  // Auto mark as read after viewing
  useEffect(() => {
    if (unreadCount > 0) {
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount, markAllAsRead]);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    // Priority: movieId -> redirectLink -> stay on notifications page
    if (notification.movieId) {
      navigate(`/movie/${notification.movieId}`);
    } else if (notification.redirectLink) {
      // Handle external or internal links
      if (notification.redirectLink.startsWith("http")) {
        window.open(notification.redirectLink, "_blank");
      } else {
        navigate(notification.redirectLink);
      }
    }
  };

  const hasClickableAction = (notification: any) => {
    return notification.movieId || notification.redirectLink;
  };

  return (
    <MainLayout>
      <div className="min-h-screen pt-16 pb-24">
        {/* Header */}
        <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                )}
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium"
              >
                <Check className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-xl bg-card animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-full bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No Notifications</h3>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                You're all caught up! We'll notify you when there's something new.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification, index) => {
                const { icon: Icon, color } = getNotificationIcon(notification.type);
                const isUnread = !notification.read;

                return (
                  <motion.button
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isUnread
                        ? "bg-primary/5 border-primary/20 shadow-lg shadow-primary/5"
                        : "bg-card border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Icon or Poster/Image */}
                      <div className="flex-shrink-0">
                        {(notification.poster || notification.imageUrl) ? (
                          <div className="w-14 h-20 rounded-lg overflow-hidden">
                            <img
                              src={notification.poster || notification.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r ${color} text-white`}>
                            {notification.type?.replace("_", " ").toUpperCase() || "NOTIFICATION"}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <h3 className={`text-sm font-semibold mb-0.5 ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
                          {notification.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                      </div>

                      {/* Arrow for clickable notifications */}
                      {hasClickableAction(notification) && (
                        <div className="flex items-center">
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Notifications;
