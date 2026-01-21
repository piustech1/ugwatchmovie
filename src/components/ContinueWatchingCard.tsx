import { Play, X } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ContinueWatchingItem, useContinueWatching } from "@/hooks/useContinueWatching";

interface ContinueWatchingCardProps {
  item: ContinueWatchingItem;
  index: number;
}

const ContinueWatchingCard = ({ item, index }: ContinueWatchingCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { removeFromContinueWatching } = useContinueWatching();

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await removeFromContinueWatching(item.movieId);
  };

  const handleClick = () => {
    // If we're already on a movie page, the navigation will trigger the cleanup effect
    // in MovieDetails which stops the current video
    navigate(`/movie/${item.movieId}`);
  };

  // Calculate remaining time
  const remainingSeconds = item.duration - item.currentTime;
  const remainingMins = Math.ceil(remainingSeconds / 60);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={handleClick}
      className="relative flex-shrink-0 w-64 md:w-72 cursor-pointer group"
    >
      {/* Image */}
      <div className="relative rounded-xl overflow-hidden aspect-video">
        <img
          src={item.backdrop || item.poster}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center neon-glow">
            <Play className="w-6 h-6 text-primary-foreground fill-current ml-0.5" />
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>

        {/* Progress Percentage Badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-xs font-semibold text-white">
          {item.progress}%
        </div>

        {/* Progress Bar - Larger and more visible */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-muted/40">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${item.progress}%` }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="h-full bg-primary"
          />
        </div>
      </div>

      {/* Info */}
      <div className="mt-2.5 px-1">
        <h3 className="text-sm font-semibold text-foreground line-clamp-1">{item.title}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span>{formatTime(item.currentTime)} / {formatTime(item.duration)}</span>
          <span className="text-primary font-medium">{remainingMins} min left</span>
        </div>
        {item.episode && (
          <p className="text-xs text-primary mt-1 font-medium">
            {item.episode.season.replace("_", " ")} • {item.episode.title}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ContinueWatchingCard;
