import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Grid, Filter, ChevronRight, User } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import MovieCard from "@/components/MovieCard";
import { useMovies } from "@/hooks/useMovies";

const Categories = () => {
  const navigate = useNavigate();
  const { movies, loading } = useMovies();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedVj, setSelectedVj] = useState<string | null>(null);

  // Extract all unique genres and count movies per genre
  const genreStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    
    movies.forEach(movie => {
      if (movie.genre) {
        const genres = movie.genre.split(",").map(g => g.trim());
        genres.forEach(genre => {
          if (genre) {
            stats[genre] = (stats[genre] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .map(([genre, count]) => ({ genre, count }));
  }, [movies]);

  // Extract all unique VJs
  const vjs = useMemo(() => {
    const allVjs = movies.map(m => m.vj).filter(Boolean) as string[];
    return Array.from(new Set(allVjs)).sort();
  }, [movies]);

  // Filter movies by selected genre and VJ
  const filteredMovies = useMemo(() => {
    let result = movies;
    
    if (selectedGenre) {
      result = result.filter(movie => 
        movie.genre?.toLowerCase().includes(selectedGenre.toLowerCase())
      );
    }
    
    if (selectedVj) {
      result = result.filter(movie => movie.vj === selectedVj);
    }
    
    return result;
  }, [movies, selectedGenre, selectedVj]);

  // Get a backdrop for each genre (first movie with that genre)
  const getGenreBackdrop = (genre: string) => {
    const movie = movies.find(m => m.genre?.toLowerCase().includes(genre.toLowerCase()) && m.backdrop);
    return movie?.backdrop || movie?.poster;
  };

  const handleClearFilters = () => {
    setSelectedGenre(null);
    setSelectedVj(null);
  };

  return (
    <MainLayout>
      <div className="min-h-screen pt-16 pb-24">
        {/* Header */}
        <div className="px-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Categories</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Browse {genreStats.length} genres • {movies.length} total titles
          </p>
        </div>

        {/* VJ Filter Dropdown */}
        {vjs.length > 0 && (
          <div className="px-4 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <select
                  value={selectedVj || ""}
                  onChange={(e) => setSelectedVj(e.target.value || null)}
                  className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[150px]"
                >
                  <option value="">All VJs</option>
                  {vjs.map((vj) => (
                    <option key={vj} value={vj}>{vj}</option>
                  ))}
                </select>
              </div>
              
              {(selectedGenre || selectedVj) && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Genre Grid */}
        <div className="px-4">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[16/9] rounded-xl shimmer" />
              ))}
            </div>
          ) : selectedGenre ? (
            // Show filtered movies
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <button
                onClick={() => setSelectedGenre(null)}
                className="flex items-center gap-2 text-primary mb-4 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Categories</span>
              </button>
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                {selectedGenre}
                <span className="text-sm text-muted-foreground font-normal">
                  ({filteredMovies.length} titles)
                </span>
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {filteredMovies.map((movie, index) => (
                  <MovieCard key={movie.id} movie={movie} index={index} />
                ))}
              </div>
            </motion.div>
          ) : selectedVj ? (
            // Show movies filtered by VJ only
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {selectedVj}
                <span className="text-sm text-muted-foreground font-normal">
                  ({filteredMovies.length} titles)
                </span>
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {filteredMovies.map((movie, index) => (
                  <MovieCard key={movie.id} movie={movie} index={index} />
                ))}
              </div>
            </motion.div>
          ) : (
            // Show genre cards
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {genreStats.map(({ genre, count }, index) => (
                <motion.button
                  key={genre}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedGenre(genre)}
                  className="relative aspect-[16/9] rounded-xl overflow-hidden group text-left"
                >
                  {/* Background */}
                  <div className="absolute inset-0">
                    {getGenreBackdrop(genre) ? (
                      <img
                        src={getGenreBackdrop(genre)}
                        alt={genre}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30" />
                    )}
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 group-hover:from-primary/80 group-hover:via-primary/40 group-hover:to-transparent transition-colors duration-300" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-3 flex flex-col justify-end">
                    <h3 className="text-base font-bold text-white mb-1">{genre}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/80">{count} {count === 1 ? 'title' : 'titles'}</span>
                      <ChevronRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Categories;
