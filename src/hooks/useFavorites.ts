import { useState, useEffect } from "react";
import { ref, onValue, set, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Movie } from "@/hooks/useMovies";
import { toast } from "sonner";

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setFavoriteMovies([]);
      setLoading(false);
      return;
    }

    const favoritesRef = ref(database, `users/${user.uid}/favorites`);
    
    const unsubscribe = onValue(favoritesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const favIds = Object.keys(data);
        setFavorites(favIds);
        
        // Get movie details
        const moviesRef = ref(database, "movies");
        onValue(moviesRef, (moviesSnapshot) => {
          const moviesData = moviesSnapshot.val();
          if (moviesData) {
            const favMovies = favIds
              .map(id => ({ id, ...moviesData[id] }))
              .filter(m => m.title);
            setFavoriteMovies(favMovies);
          }
        }, { onlyOnce: true });
      } else {
        setFavorites([]);
        setFavoriteMovies([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addToFavorites = async (movie: Movie) => {
    if (!user) {
      toast.error("Please sign in to add favorites");
      return false;
    }

    try {
      const favoriteRef = ref(database, `users/${user.uid}/favorites/${movie.id}`);
      await set(favoriteRef, {
        addedAt: Date.now(),
        title: movie.title,
        poster: movie.poster || "",
      });
      toast.success("Added to watchlist");
      return true;
    } catch (error) {
      toast.error("Failed to add to watchlist");
      return false;
    }
  };

  const removeFromFavorites = async (movieId: string) => {
    if (!user) return false;

    try {
      const favoriteRef = ref(database, `users/${user.uid}/favorites/${movieId}`);
      await remove(favoriteRef);
      toast.success("Removed from watchlist");
      return true;
    } catch (error) {
      toast.error("Failed to remove from watchlist");
      return false;
    }
  };

  const isFavorite = (movieId: string) => favorites.includes(movieId);

  const toggleFavorite = async (movie: Movie) => {
    if (isFavorite(movie.id)) {
      return removeFromFavorites(movie.id);
    } else {
      return addToFavorites(movie);
    }
  };

  return {
    favorites,
    favoriteMovies,
    loading,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
  };
};
