import MainLayout from "@/components/MainLayout";
import { useTrending } from "@/hooks/useTrending";
import TrendingMovieCard from "@/components/TrendingMovieCard";
import { Flame, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const TrendingSkeleton = () => (
  <div className="space-y-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-card/30 rounded-xl p-3 animate-pulse">
        <div className="flex gap-3">
          <div className="w-24 sm:w-28 md:w-32 aspect-[2/3] rounded-lg bg-muted" />
          <div className="flex-1 space-y-3 py-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-6 bg-muted rounded w-20" />
            <div className="h-3 bg-muted rounded w-2/3 mt-auto" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Trending = () => {
  const { trendingMovies, loading } = useTrending();

  return (
    <MainLayout>
      <div className="min-h-screen pt-16 pb-24 px-4">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <Flame className="w-8 h-8 text-orange-500" />
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Trending Now
            </h1>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm md:text-base">Most watched this week</p>
          </div>

          {/* Stats Bar */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 mt-4 p-3 rounded-xl bg-gradient-to-r from-primary/10 via-card/50 to-orange-500/10 border border-primary/20"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Auto-updated daily</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs text-muted-foreground">
              {trendingMovies.length} trending titles
            </span>
          </motion.div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <TrendingSkeleton />
        ) : trendingMovies.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
              <Flame className="w-10 h-10 text-orange-500/50" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No Trending Content Yet</h2>
            <p className="text-muted-foreground text-sm text-center max-w-xs">
              Start watching movies to see what's trending. The more you watch, the better our recommendations!
            </p>
          </motion.div>
        ) : (
          <>
            {/* Top 3 Spotlight */}
            {trendingMovies.length >= 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-8 h-0.5 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full" />
                  Top 3 This Week
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {trendingMovies.slice(0, 3).map((movie, index) => (
                    <TrendingMovieCard 
                      key={movie.id} 
                      movie={movie} 
                      rank={index + 1} 
                      index={index}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Rest of Trending */}
            {trendingMovies.length > 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-8 h-0.5 bg-gradient-to-r from-primary/50 to-primary rounded-full" />
                  More Trending
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {trendingMovies.slice(3).map((movie, index) => (
                    <TrendingMovieCard 
                      key={movie.id} 
                      movie={movie} 
                      rank={index + 4} 
                      index={index}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Trending;
