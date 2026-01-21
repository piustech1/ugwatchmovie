import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import App from "./App.tsx";
import SplashScreen from "./components/SplashScreen.tsx";
import "./index.css";

const Root = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Check if this is a PWA/standalone mode launch
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true ||
                         document.referrer.includes('android-app://');
    
    // Also show splash on first visit or PWA launch
    const hasSeenSplash = sessionStorage.getItem('splash-shown');
    
    if (!isStandalone && hasSeenSplash) {
      setShowSplash(false);
      setAppReady(true);
    } else {
      sessionStorage.setItem('splash-shown', 'true');
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setAppReady(true);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {appReady && <App />}
    </>
  );
};

createRoot(document.getElementById("root")!).render(<Root />);
