import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Film } from "lucide-react";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import MovieCard from "@/components/MovieCard";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Watchlist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favoriteMovies, loading } = useFavorites();

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Sign In Required</h2>
            <p className="text-muted-foreground text-sm mb-4">Sign in to view your watchlist</p>
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen pt-16 pb-24">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">My Watchlist</h1>
          </div>
        </div>

        <div className="px-4 py-6">
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-xl shimmer" />
              ))}
            </div>
          ) : favoriteMovies.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {favoriteMovies.map((movie, index) => (
                <MovieCard key={movie.id} movie={movie} index={index} />
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 mb-3 rounded-full bg-muted flex items-center justify-center">
                <Film className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">No Favorites Yet</h3>
              <p className="text-muted-foreground text-sm">Tap the heart icon on movies to save them here</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Watchlist;
