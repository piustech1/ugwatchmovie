import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Check, Monitor, Smartphone, Zap, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMovies } from "@/hooks/useMovies";

const Welcome = () => {
  const navigate = useNavigate();
  const { movies } = useMovies();
  const [scrolled, setScrolled] = useState(false);
  const [currentBackdropIndex, setCurrentBackdropIndex] = useState(0);

  // Get recent movies with backdrops, sorted by upload date
  const backdropMovies = useMemo(() => {
    return movies
      .filter((movie) => movie.backdrop)
      .sort((a, b) => {
        const dateA = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
        const dateB = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [movies]);

  // Auto-change backdrop every 6 seconds
  useEffect(() => {
    if (backdropMovies.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentBackdropIndex((prev) => (prev + 1) % backdropMovies.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [backdropMovies.length]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    { icon: Monitor, text: "Watch in HD Quality" },
    { icon: Zap, text: "Unlimited Streaming" },
    { icon: Smartphone, text: "Mobile & Desktop Support" },
    { icon: Film, text: "New Movies Updated Daily" },
  ];

  const currentBackdrop = backdropMovies[currentBackdropIndex];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-background/95 backdrop-blur-lg border-b border-border" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                <span className="text-foreground">Muno</span>
                <span className="text-primary neon-text">Stream</span>
              </span>
            </Link>

            {/* Nav Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="text-foreground hover:text-primary font-medium"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
              >
                Register
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Full-screen Auto-changing Backdrop */}
        <div className="absolute inset-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {currentBackdrop && (
              <motion.div
                key={currentBackdrop.id}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0"
              >
                <img
                  src={currentBackdrop.backdrop}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Dark Overlays for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-background/90" />
          <div className="absolute inset-0 bg-background/30" />
          
          {/* Animated gradient overlay */}
          <motion.div
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="absolute inset-0 opacity-40"
            style={{
              background: "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.3) 0%, transparent 50%)",
              backgroundSize: "200% 200%",
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-8"
            >
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-primary text-sm font-medium">Now Streaming</span>
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-tight mb-6">
              Unlimited Movies,{" "}
              <span className="text-primary neon-text">Series</span>
              <br />
              and Entertainment
            </h1>

            {/* Tagline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Watch anytime, anywhere. Stream instantly with high quality content updated daily.
            </p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                className="w-full sm:w-auto h-14 px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-lg neon-glow pulse-neon"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Start Watching
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-14 px-10 border-2 border-border hover:border-primary/50 hover:bg-primary/10 text-foreground font-semibold text-lg rounded-lg"
              >
                Join Now — It's Free
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Backdrop Indicators */}
        {backdropMovies.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2"
          >
            {backdropMovies.map((movie, index) => (
              <button
                key={movie.id}
                onClick={() => setCurrentBackdropIndex(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentBackdropIndex
                    ? "w-8 h-2 bg-primary"
                    : "w-2 h-2 bg-muted-foreground/40 hover:bg-muted-foreground/60"
                }`}
                aria-label={`View backdrop ${index + 1}`}
              />
            ))}
          </motion.div>
        )}
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Why Choose <span className="text-primary">UgaWatch</span>?
            </h2>
            <p className="text-muted-foreground">
              Experience premium entertainment without the premium price
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-5 bg-card/50 border border-border rounded-xl hover:border-primary/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-medium">{feature.text}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 bg-gradient-to-br from-primary/10 via-card to-secondary/10 border border-primary/20 rounded-2xl"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to Start Streaming?
            </h3>
            <p className="text-muted-foreground mb-8">
              Join thousands of users enjoying unlimited entertainment
            </p>
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="h-14 px-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-lg neon-glow"
            >
              Get Started Free
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">
              <span className="text-foreground">Uga</span>
              <span className="text-primary">Watch</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/disclaimer" className="hover:text-primary transition-colors">Disclaimer</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 UgaWatch. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;