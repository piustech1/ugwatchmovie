import { motion } from "framer-motion";
import { Play, Heart, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Movie } from "@/hooks/useMovies";
import { useFavorites } from "@/hooks/useFavorites";
import { MovieStats } from "@/hooks/useTrending";

interface TrendingMovieCardProps {
  movie: Movie & { stats?: MovieStats };
  rank: number;
  index?: number;
}

const TrendingMovieCard = ({ movie, rank, index = 0 }: TrendingMovieCardProps) => {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isLiked = isFavorite(movie.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(movie);
  };

  const getRankBadgeStyle = () => {
    if (rank === 1) return "from-yellow-400 via-yellow-500 to-amber-600 shadow-yellow-500/50";
    if (rank === 2) return "from-slate-300 via-slate-400 to-slate-500 shadow-slate-400/50";
    if (rank === 3) return "from-amber-600 via-amber-700 to-amber-800 shadow-amber-600/50";
    return "from-primary/80 to-primary shadow-primary/30";
  };

  const getQualityBadge = () => {
    // Determine quality based on available data or default to HD
    return "HD";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="relative cursor-pointer group"
      onClick={() => navigate(`/movie/${movie.id}`)}
    >
      <div className="relative bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden border border-border/30 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/10">
        {/* Large Rank Badge */}
        <div className={`absolute -left-2 -top-2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${getRankBadgeStyle()} flex items-center justify-center shadow-lg`}>
          <span className="text-white font-black text-lg md:text-xl">#{rank}</span>
        </div>

        <div className="flex gap-3 p-3">
          {/* Poster */}
          <div className="relative flex-shrink-0 w-24 sm:w-28 md:w-32 aspect-[2/3] rounded-lg overflow-hidden">
            <img
              src={movie.poster || "/placeholder.svg"}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            
            {/* Quality Badge */}
            <div className="absolute top-1.5 right-1.5">
              <span className="px-1.5 py-0.5 bg-primary/90 text-primary-foreground text-[9px] font-bold rounded shadow-lg">
                {getQualityBadge()}
              </span>
            </div>

            {/* Play Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/50"
              >
                <Play className="w-5 h-5 text-primary-foreground fill-current ml-0.5" />
              </motion.div>
            </motion.div>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
            <div>
              <h3 className="font-bold text-foreground text-sm md:text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                {movie.title}
              </h3>
              
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="text-xs text-muted-foreground">{movie.year}</span>
                {movie.genre && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">{movie.genre.split(',')[0]}</span>
                  </>
                )}
              </div>

              {/* VJ Badge */}
              {movie.vj && (
                <span className="inline-block px-2 py-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-semibold rounded-full uppercase tracking-wide">
                  {movie.vj}
                </span>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs">
                  {movie.stats?.weeklyViews || movie.views || 0} views this week
                </span>
              </div>
              
              {/* Favorite Button */}
              <button
                onClick={handleFavoriteClick}
                className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-all hover:scale-110"
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Trending Indicator Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
};

export default TrendingMovieCard;
