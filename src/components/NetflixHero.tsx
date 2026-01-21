import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Movie } from "@/hooks/useMovies";
import { useNavigate } from "react-router-dom";

interface NetflixHeroProps {
  movies: Movie[];
}

const NetflixHero = ({ movies: inputMovies }: NetflixHeroProps) => {
  // Sort by upload date (newest first) and take top 10
  const movies = [...inputMovies].sort((a, b) => (b.uploadDate || 0) - (a.uploadDate || 0)).slice(0, 10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const SLIDE_DURATION = 8000; // 8 seconds per slide
  const MAX_DESCRIPTION_LENGTH = 150;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
    setProgress(0);
    setIsExpanded(false);
  }, [movies.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
    setProgress(0);
    setIsExpanded(false);
  }, [movies.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
    setIsExpanded(false);
  };

  // Auto-progress with visual timer
  useEffect(() => {
    if (movies.length <= 1 || isHovered) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + (100 / (SLIDE_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [movies.length, isHovered, nextSlide]);

  if (!movies.length) {
    return (
      <div className="relative h-[70vh] md:h-[85vh] bg-gradient-to-b from-muted to-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to UgaWatch</h2>
          <p className="text-muted-foreground">Content coming soon...</p>
        </div>
      </div>
    );
  }

  const currentMovie = movies[currentIndex];
  
  // Get VJ name - remove "VJ" prefix if it already exists in the data
  const getVJName = (vj: string | undefined) => {
    if (!vj) return null;
    const cleaned = vj.trim();
    // Remove leading "VJ" or "Vj" or "vj" if present
    const withoutPrefix = cleaned.replace(/^[Vv][Jj]\s*/i, '');
    return withoutPrefix || null;
  };

  const vjName = getVJName(currentMovie.vj);
  
  // Get content type label
  const contentType = currentMovie.isSeries ? "Series" : "Movie";
  
  // Handle description truncation
  const description = currentMovie.description || "An exciting new addition to our collection. Watch now to experience the thrill.";
  const shouldTruncate = description.length > MAX_DESCRIPTION_LENGTH;
  const displayDescription = isExpanded || !shouldTruncate 
    ? description 
    : description.slice(0, MAX_DESCRIPTION_LENGTH) + "...";

  return (
    <div 
      className="relative h-[70vh] md:h-[85vh] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image with Cinematic Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMovie.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src={currentMovie.backdrop || currentMovie.poster}
            alt={currentMovie.title}
            className="w-full h-full object-cover object-top"
          />
          
          {/* Multiple Gradient Overlays for Cinematic Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent h-32" />
          
          {/* Vignette Effect */}
          <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.5)]" />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {movies.length > 1 && (
        <>
          <motion.button
            onClick={prevSlide}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -20 }}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full bg-background/30 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-background/50 hover:scale-110 transition-all z-20 group"
          >
            <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </motion.button>
          <motion.button
            onClick={nextSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 20 }}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full bg-background/30 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-background/50 hover:scale-110 transition-all z-20 group"
          >
            <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </motion.button>
        </>
      )}

      {/* Content Section */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentMovie.id}`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-2xl"
          >
            {/* Top Badge - Content Type & VJ */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 mb-4 flex-wrap"
            >
              <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded uppercase tracking-wider border border-primary/30">
                {contentType}
              </span>
              {vjName && (
                <span className="px-3 py-1 bg-secondary/20 text-secondary text-xs font-bold rounded uppercase tracking-wider border border-secondary/30">
                  VJ {vjName}
                </span>
              )}
              {currentMovie.rating && (
                <span className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded">
                  ⭐ {currentMovie.rating}
                </span>
              )}
            </motion.div>

            {/* Title - Large Cinematic Style */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-none mb-4 tracking-tight"
              style={{ textShadow: "2px 2px 20px rgba(0,0,0,0.5)" }}
            >
              {currentMovie.title}
            </motion.h1>
            
            {/* Metadata Row */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 text-sm text-white/80 mb-4 flex-wrap"
            >
              <span className="text-primary font-semibold">New</span>
              <span>{currentMovie.year}</span>
              {currentMovie.genre && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/50" />
                  <span>{currentMovie.genre}</span>
                </>
              )}
              <span className="px-1.5 py-0.5 border border-white/30 text-xs rounded">HD</span>
            </motion.div>

            {/* Description with Read More */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 max-w-xl"
            >
              <p className="text-white/80 text-base md:text-lg leading-relaxed">
                {displayDescription}
              </p>
              {shouldTruncate && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-primary font-semibold text-sm mt-2 hover:underline transition-all"
                >
                  {isExpanded ? "Show Less" : "Read More"}
                </button>
              )}
            </motion.div>

            {/* Action Buttons - App Theme Colors */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-3 flex-wrap"
            >
              <Button 
                onClick={() => {
                  // Trigger Android advertisement bridge
                  if (typeof (window as any).Android?.sendData === "function") {
                    (window as any).Android.sendData("Advertisement");
                  }
                  navigate(`/movie/${currentMovie.id}`);
                }}
                size="lg"
                className="gap-2 h-12 md:h-14 px-8 md:px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base md:text-lg rounded-lg neon-glow"
              >
                <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                Play
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate(`/movie/${currentMovie.id}`)}
                size="lg"
                className="gap-2 h-12 md:h-14 px-6 md:px-8 bg-secondary/20 hover:bg-secondary/40 border border-secondary/50 text-white font-semibold text-base md:text-lg rounded-lg backdrop-blur-sm"
              >
                <Info className="w-5 h-5 md:w-6 md:h-6" />
                More Info
              </Button>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Slide Indicators with Progress */}
        {movies.length > 1 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-2 mt-8"
          >
            {movies.map((movie, index) => (
              <button
                key={movie.id}
                onClick={() => goToSlide(index)}
                className="group relative h-1 rounded-full overflow-hidden transition-all duration-300"
                style={{ width: index === currentIndex ? "48px" : "24px" }}
              >
                <div className="absolute inset-0 bg-white/30 group-hover:bg-white/40 transition-colors" />
                {index === currentIndex && (
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-primary"
                    style={{ width: `${progress}%` }}
                  />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Bottom Right - Age Rating Badge */}
      <div className="absolute bottom-6 md:bottom-12 right-4 md:right-12 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background/60 backdrop-blur-sm border-l-2 border-primary/50">
          <span className="text-white text-sm font-medium">18+</span>
        </div>
      </div>
    </div>
  );
};

export default NetflixHero;