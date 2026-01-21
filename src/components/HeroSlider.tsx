import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Movie } from "@/hooks/useMovies";
import { useNavigate } from "react-router-dom";

interface HeroSliderProps {
  movies: Movie[];
}

const HeroSlider = ({ movies: inputMovies }: HeroSliderProps) => {
  // Sort movies by uploadDate (newest first) so hero shows recently uploaded movies
  const movies = [...inputMovies].sort((a, b) => (b.uploadDate || 0) - (a.uploadDate || 0));
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  }, [movies.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
  }, [movies.length]);

  useEffect(() => {
    if (movies.length <= 1) return;
    
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [movies.length, nextSlide]);

  if (!movies.length) {
    return (
      <div className="relative h-[50vh] md:h-[60vh] bg-gradient-to-b from-muted to-background">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>
    );
  }

  const currentMovie = movies[currentIndex];

  return (
    <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
      {/* Background Image with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMovie.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <img
            src={currentMovie.backdrop || currentMovie.poster}
            alt={currentMovie.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows - Desktop */}
      {movies.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm items-center justify-center hover:bg-background/40 transition-colors z-20"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={nextSlide}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm items-center justify-center hover:bg-background/40 transition-colors z-20"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 lg:p-12 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentMovie.id}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl"
          >
            {/* Badges */}
            <div className="flex items-center gap-2 mb-2">
              {currentMovie.vj && (
                <span className="px-2 py-0.5 bg-secondary/90 text-secondary-foreground text-xs font-semibold rounded">
                  {currentMovie.vj}
                </span>
              )}
              {currentMovie.rating && (
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-semibold rounded">
                  {currentMovie.rating}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-2">
              {currentMovie.title}
            </h1>
            
            {/* Metadata */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <span>{currentMovie.year}</span>
              {currentMovie.genre && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                  <span>{currentMovie.genre}</span>
                </>
              )}
            </div>

            {/* Description - Limited */}
            <p className="text-foreground/70 text-sm line-clamp-2 mb-4 max-w-md hidden md:block">
              {currentMovie.description}
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => navigate(`/movie/${currentMovie.id}`)}
                className="gap-2 h-10 px-6"
              >
                <Play className="w-4 h-4 fill-current" />
                Watch Now
              </Button>
              <Button 
                variant="glass"
                onClick={() => navigate(`/movie/${currentMovie.id}`)}
                className="gap-2 h-10"
              >
                <Info className="w-4 h-4" />
                Details
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide Indicators */}
        {movies.length > 1 && (
          <div className="flex items-center gap-1.5 mt-4">
            {movies.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? "w-6 bg-primary" 
                    : "w-1.5 bg-foreground/30 hover:bg-foreground/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroSlider;
