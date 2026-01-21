import { useState, useEffect } from "react";
import { Send, Loader2, Bell, Megaphone, Gift, RefreshCw, Image as ImageIcon, Smartphone, Link as LinkIcon } from "lucide-react";
import { ref, push, onValue, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { supabase } from "@/integrations/supabase/client";

type NotificationType = "update" | "announcement" | "promo" | "news";

const notificationTypes = [
  { value: "announcement", label: "Announcement", icon: Megaphone, color: "from-pink-500 to-red-500" },
  { value: "update", label: "Update", icon: RefreshCw, color: "from-orange-500 to-yellow-500" },
  { value: "promo", label: "Promo", icon: Gift, color: "from-purple-500 to-indigo-500" },
  { value: "news", label: "News", icon: Bell, color: "from-blue-500 to-cyan-500" },
] as const;

const AdminNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "announcement" as NotificationType,
    imageUrl: "",
    redirectLink: "",
  });
  
  const { token, isEnabled, requestPermission } = usePushNotifications();

  const sendTestNotification = async () => {
    if (!isEnabled) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    
    let currentToken = token || localStorage.getItem("ugawatch_fcm_token");
    if (!currentToken) {
      // If permission is already granted but token isn't available (common after reload), try generating it again.
      const granted = await requestPermission();
      if (!granted) return;
      currentToken = token || localStorage.getItem("ugawatch_fcm_token");
      if (!currentToken) {
        toast({ title: "No device token", description: "Couldn't generate a token on this device/browser.", variant: "destructive" });
        return;
      }
    }

    setTestLoading(true);
    try {
      // Show a local notification directly via service worker
      if ("serviceWorker" in navigator && "Notification" in window && Notification.permission === "granted") {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification("🎬 Test Notification", {
          body: "Push notifications are working! You'll receive alerts for new content.",
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "test-notification",
          data: { test: true },
        } as NotificationOptions);
        toast({ title: "Test notification sent!", description: "Check your device notifications." });
      } else {
        toast({ title: "Cannot send test", description: "Notifications not available.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Test notification error:", error);
      toast({ title: "Failed to send test", variant: "destructive" });
    } finally {
      setTestLoading(false);
    }
  };

  // Fetch all FCM tokens from Firebase and send push notifications
  const sendPushToAllUsers = async (title: string, body: string, imageUrl?: string, redirectLink?: string) => {
    try {
      // Get all FCM tokens from Firebase
      const tokensRef = ref(database, "fcmTokens");
      const snapshot = await get(tokensRef);
      
      if (!snapshot.exists()) {
        console.log("No FCM tokens found in database");
        toast({ 
          title: "No subscribers", 
          description: "No users have enabled push notifications yet.",
          variant: "destructive"
        });
        return { sent: 0, failed: 0 };
      }

      const tokensData = snapshot.val();
      const tokens: string[] = [];
      
      // Extract tokens properly
      Object.values(tokensData).forEach((item: any) => {
        if (item && item.token && typeof item.token === 'string') {
          tokens.push(item.token);
        }
      });
      
      if (tokens.length === 0) {
        console.log("No valid tokens to send to");
        toast({ 
          title: "No valid tokens", 
          description: "No valid device tokens found.",
          variant: "destructive"
        });
        return { sent: 0, failed: 0 };
      }

      console.log(`Sending push notification to ${tokens.length} devices...`);

      // Call edge function to send notifications
      const { data, error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          tokens,
          title,
          body,
          image: imageUrl || undefined,
          data: {
            link: redirectLink || "/notifications",
            type: "admin",
          },
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        toast({ 
          title: "Push failed", 
          description: `Edge function error: ${error.message}`,
          variant: "destructive"
        });
        return { sent: 0, failed: tokens.length };
      }

      console.log("Push notification result:", data);
      return { sent: data?.sent || 0, failed: data?.failed || 0 };
    } catch (error) {
      console.error("Error sending push notifications:", error);
      toast({ 
        title: "Error", 
        description: `Failed to send push: ${error}`,
        variant: "destructive"
      });
      return { sent: 0, failed: 0 };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({ title: "Please fill in title and message", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Save notification to Firebase
      const notificationsRef = ref(database, "notifications");
      await push(notificationsRef, {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        imageUrl: formData.imageUrl || null,
        redirectLink: formData.redirectLink || null,
        timestamp: Date.now(),
        read: false,
      });

      // Send push notifications to all users
      const pushResult = await sendPushToAllUsers(
        formData.title,
        formData.message,
        formData.imageUrl,
        formData.redirectLink
      );

      toast({ 
        title: "Notification sent!", 
        description: `Saved & pushed to ${pushResult.sent} devices.`
      });
      
      setFormData({ title: "", message: "", type: "announcement", imageUrl: "", redirectLink: "" });
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({ title: "Failed to send notification", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const selectedType = notificationTypes.find(t => t.value === formData.type);
  const TypeIcon = selectedType?.icon || Bell;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Send Notification</h1>
            <p className="text-sm text-muted-foreground">Broadcast updates, news & promos to all users</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isEnabled && (
            <Button
              onClick={async () => {
                const granted = await requestPermission();
                if (granted) {
                  toast({ title: "Notifications enabled!", description: "You can now receive push notifications." });
                }
              }}
              variant="default"
              className="gap-2"
            >
              <Bell className="w-4 h-4" />
              Enable Notifications
            </Button>
          )}
          <Button
            onClick={sendTestNotification}
            disabled={testLoading}
            variant="outline"
            className="gap-2"
          >
            {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
            Test on This Device
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Notification Type Selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Notification Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {notificationTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.type === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center mx-auto mb-2`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <p className={`text-xs font-medium ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                        {type.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., 🎉 Big Announcement!"
                required
                className="w-full px-4 py-2.5 bg-muted rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Message *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Write your notification message..."
                required
                rows={3}
                className="w-full px-4 py-2.5 bg-muted rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Image URL (Optional) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <span className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Image URL (Optional)
                </span>
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2.5 bg-muted rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Redirect Link (Optional) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <span className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Redirect Link (Optional)
                </span>
              </label>
              <input
                type="url"
                value={formData.redirectLink}
                onChange={(e) => setFormData({ ...formData, redirectLink: e.target.value })}
                placeholder="https://ugawatch.com/promo"
                className="w-full px-4 py-2.5 bg-muted rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">Where users go when they click the notification</p>
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              {loading ? "Sending..." : "Send Notification"}
            </Button>
          </form>
        </motion.div>

        {/* Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-foreground">Preview</h3>
          
          {/* Mobile Preview */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-lg">
            <div className="bg-muted/50 px-4 py-2 border-b border-border">
              <p className="text-xs text-muted-foreground text-center">Notification Preview</p>
            </div>
            
            <div className="p-4">
              {formData.title || formData.message ? (
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedType?.color || "from-primary to-primary/60"} flex items-center justify-center flex-shrink-0`}>
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <TypeIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r ${selectedType?.color || "from-primary to-primary/60"} text-white`}>
                        {selectedType?.label.toUpperCase() || "NOTIFICATION"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Just now</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {formData.title || "Notification Title"}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {formData.message || "Your message will appear here..."}
                    </p>
                    {formData.redirectLink && (
                      <p className="text-xs text-primary mt-1 truncate">
                        → {formData.redirectLink}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                  Start typing to see preview
                </div>
              )}
            </div>

            {/* Large Image Preview */}
            {formData.imageUrl && (
              <div className="px-4 pb-4">
                <div className="rounded-xl overflow-hidden">
                  <img 
                    src={formData.imageUrl} 
                    alt="Notification Image" 
                    className="w-full h-48 object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-muted/50 rounded-xl p-4 border border-border">
            <h4 className="text-sm font-semibold text-foreground mb-2">💡 Tips</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Use emojis to make notifications more engaging</li>
              <li>• Add an image URL for visual notifications</li>
              <li>• Include a redirect link to drive user action</li>
              <li>• Keep messages short and clear</li>
              <li>• New movies/series auto-notify when uploaded</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminNotifications;