import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export const PushNotificationDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { permission, isSupported, loading, requestPermission } = usePushNotifications();

  useEffect(() => {
    if (loading || !isSupported) return;
    
    // Only show if permission hasn't been granted or denied yet
    const hasSeenPrompt = localStorage.getItem("ugawatch_push_prompt_seen");
    
    if (permission === "default" && !hasSeenPrompt) {
      // Show after a short delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [permission, isSupported, loading]);

  const handleEnable = async () => {
    localStorage.setItem("ugawatch_push_prompt_seen", "true");
    await requestPermission();
    setIsOpen(false);
  };

  const handleClose = () => {
    localStorage.setItem("ugawatch_push_prompt_seen", "true");
    setIsOpen(false);
  };

  if (!isSupported) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-primary/20 shadow-2xl shadow-primary/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors z-10"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="relative p-6 pt-8 text-center">
              {/* Icon with glow effect */}
              <div className="relative mx-auto w-20 h-20 mb-5">
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
                <div className="relative w-full h-full bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                  <Bell className="w-9 h-9 text-primary-foreground" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="absolute -top-1 -right-1 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Sparkles className="w-4 h-4 text-yellow-900" />
                </motion.div>
              </div>

              {/* Text */}
              <h2 className="text-xl font-bold text-foreground mb-2">
                Stay Updated!
              </h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                Enable push notifications to get instant alerts when new movies and series are added to UgaWatch.
              </p>

              {/* Buttons */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleEnable}
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Enable Notifications
                </Button>
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
