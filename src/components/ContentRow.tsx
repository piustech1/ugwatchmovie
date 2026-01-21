import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import MovieCard from "@/components/MovieCard";
import { Movie } from "@/hooks/useMovies";

interface ContentRowProps {
  title: string;
  icon?: React.ReactNode;
  movies: Movie[];
  seeMoreLink?: string;
}

const ContentRow = ({ title, icon, movies, seeMoreLink }: ContentRowProps) => {
  if (!movies.length) return null;

  return (
    <section className="py-3">
      <div className="flex items-center justify-between mb-2 px-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        {seeMoreLink && (
          <Link 
            to={seeMoreLink}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            See All
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4">
        {movies.map((movie, index) => (
          <MovieCard key={movie.id} movie={movie} index={index} />
        ))}
      </div>
    </section>
  );
};

export default ContentRow;
