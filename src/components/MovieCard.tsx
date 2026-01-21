import { motion } from "framer-motion";
import { Play, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Movie } from "@/hooks/useMovies";
import { useFavorites } from "@/hooks/useFavorites";

interface MovieCardProps {
  movie: Movie;
  index?: number;
  showMetadata?: boolean;
}

const MovieCard = ({ movie, index = 0 }: MovieCardProps) => {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isLiked = isFavorite(movie.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(movie);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex-shrink-0 cursor-pointer group w-28 sm:w-32 md:w-36"
      onClick={() => navigate(`/movie/${movie.id}`)}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
        <img
          src={movie.poster || "/placeholder.svg"}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-black/70"
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-red-500 text-red-500" : "text-white"}`} />
        </button>

        {/* Play icon on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="w-4 h-4 text-primary-foreground fill-current ml-0.5" />
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
          {movie.vj && (
            <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-bold rounded shadow-lg uppercase tracking-wide">
              {movie.vj}
            </span>
          )}
          {movie.isSeries && (
            <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[8px] font-bold rounded shadow-lg uppercase">
              Series
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard;
