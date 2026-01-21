import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Film, Clock, TrendingUp, Tv, Star, Baby, Users, Archive, FileVideo } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import MovieCard from "@/components/MovieCard";
import { useMovies } from "@/hooks/useMovies";

const categoryConfig: { [key: string]: { title: string; icon: typeof Film } } = {
  popular: { title: "Popular", icon: Star },
  new: { title: "New Releases", icon: Clock },
  trending: { title: "Trending", icon: TrendingUp },
  series: { title: "TV Series", icon: Tv },
  kids: { title: "Kids & Family", icon: Baby },
  teens: { title: "Teens", icon: Users },
  documentary: { title: "Documentary", icon: FileVideo },
  vintage: { title: "Vintage Classics", icon: Archive },
};

const Category = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { movies, loading, getPopularMovies, getNewReleases, getTrendingMovies, getSeries } = useMovies();

  const getCategoryMovies = () => {
    if (!category) return movies;
    
    switch (category.toLowerCase()) {
      case "popular":
        return getPopularMovies();
      case "new":
        return getNewReleases();
      case "trending":
        return getTrendingMovies();
      case "series":
        return getSeries();
      case "kids":
        return movies.filter(m => 
          m.genre?.toLowerCase().includes('kids') || 
          m.genre?.toLowerCase().includes('animation') || 
          m.section === 'kids'
        );
      case "teens":
        return movies.filter(m => 
          m.genre?.toLowerCase().includes('teen') || 
          m.section === 'teens'
        );
      case "documentary":
        return movies.filter(m => 
          m.genre?.toLowerCase().includes('documentary') || 
          m.section === 'documentary'
        );
      case "vintage":
        return movies.filter(m => 
          parseInt(m.year) < 2000 || 
          m.section === 'vintage'
        );
      default:
        return movies.filter(m => 
          m.genre?.toLowerCase().includes(category.toLowerCase())
        );
    }
  };

  const categoryMovies = getCategoryMovies();
  const config = categoryConfig[category?.toLowerCase() || ""] || { 
    title: category || "Movies", 
    icon: Film 
  };
  const Icon = config.icon;

  return (
    <MainLayout>
      <div className="min-h-screen pt-16 pb-24">
        {/* Header */}
        <div className="px-4 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">{config.title}</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {categoryMovies.length} {categoryMovies.length === 1 ? "title" : "titles"} available
          </p>
        </div>

        {/* Movie Grid */}
        <div className="px-4">
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-xl shimmer" />
              ))}
            </div>
          ) : categoryMovies.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {categoryMovies.map((movie, index) => (
                <div key={movie.id} className="flex justify-center">
                  <MovieCard movie={movie} index={index} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                <Film className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Movies Found</h3>
              <p className="text-muted-foreground text-sm">
                No content available in this category yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Category;
