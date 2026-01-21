import { motion } from "framer-motion";
import { useMovies } from "@/hooks/useMovies";

interface GenreChipsProps {
  onGenreSelect: (genre: string | null) => void;
  selectedGenre: string | null;
}

const GenreChips = ({ onGenreSelect, selectedGenre }: GenreChipsProps) => {
  const { movies } = useMovies();

  // Extract unique genres from movies
  const genres = Array.from(
    new Set(
      movies
        .map(m => m.genre)
        .filter(Boolean)
        .flatMap(g => g.split(/[,/]/).map(s => s.trim()))
    )
  ).sort();

  const allGenres = ["All", ...genres.slice(0, 15)];

  return (
    <div className="w-full bg-background border-b border-border">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
        {allGenres.map((genre) => {
          const isSelected = genre === "All" ? !selectedGenre : selectedGenre === genre;
          
          return (
            <motion.button
              key={genre}
              whileTap={{ scale: 0.95 }}
              onClick={() => onGenreSelect(genre === "All" ? null : genre)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {genre}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default GenreChips;
