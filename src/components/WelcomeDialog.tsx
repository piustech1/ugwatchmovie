import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle, Sparkles, Film } from "lucide-react";
import { Button } from "@/components/ui/button";

const WelcomeDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem("ugawatch_visited");
    if (!hasVisited) {
      setTimeout(() => setIsOpen(true), 1500);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("ugawatch_visited", "true");
    setIsOpen(false);
  };

  const openTelegram = () => {
    window.open("https://t.me/devmindsatwork", "_blank");
  };

  const openWhatsApp = () => {
    window.open("https://wa.me/256709728322", "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-gradient-to-br from-card via-card to-primary/10 rounded-2xl p-6 border border-primary/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg neon-glow"
              >
                <Film className="w-10 h-10 text-primary-foreground" />
              </motion.div>
            </div>

            {/* Title */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Welcome to UgaWatch</h2>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm">
                Your ultimate destination for movies & series. Join our community for updates and requests!
              </p>
            </div>

            {/* Social Buttons */}
            <div className="space-y-3 mb-4">
              <Button
                onClick={openTelegram}
                className="w-full h-12 gap-3 bg-[#0088cc] hover:bg-[#0077b5] text-white"
              >
                <Send className="w-5 h-5" />
                Join Telegram Channel
              </Button>
              
              <Button
                onClick={openWhatsApp}
                className="w-full h-12 gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white"
              >
                <MessageCircle className="w-5 h-5" />
                Join WhatsApp Channel
              </Button>
            </div>

            {/* Skip */}
            <button
              onClick={handleClose}
              className="w-full text-center text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Maybe Later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeDialog;
