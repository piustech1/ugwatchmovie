import { useState, useEffect } from "react";
import { ref, onValue, query, orderByChild, limitToFirst } from "firebase/database";
import { database } from "@/lib/firebase";

export interface Movie {
  id: string;
  title: string;
  description: string;
  year: string;
  genre: string;
  rating: string;
  vj: string;
  poster: string;
  backdrop: string;
  streamUrl: string;
  views: number;
  uploadDate: number;
  featured: boolean;
  trending: boolean;
  isSeries: boolean;
  section: string;
  episodes?: {
    [season: string]: {
      [episode: string]: {
        title: string;
        streamUrl: string;
        backdrop: string;
      };
    };
  };
}

export const useMovies = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const moviesRef = ref(database, "movies");
    
    const unsubscribe = onValue(moviesRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const moviesArray = Object.entries(data).map(([id, movie]) => ({
            id,
            ...(movie as Omit<Movie, "id">)
          }));
          setMovies(moviesArray);
        } else {
          setMovies([]);
        }
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch movies");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const getFeaturedMovies = () => movies.filter(m => m.featured);
  const getTrendingMovies = () => movies.filter(m => m.trending).sort((a, b) => b.views - a.views);
  const getPopularMovies = () => [...movies].sort((a, b) => b.views - a.views);
  const getNewReleases = () => [...movies].sort((a, b) => b.uploadDate - a.uploadDate);
  const getSeries = () => movies.filter(m => m.isSeries);
  const getBySection = (section: string) => movies.filter(m => m.section === section);

  return {
    movies,
    loading,
    error,
    getFeaturedMovies,
    getTrendingMovies,
    getPopularMovies,
    getNewReleases,
    getSeries,
    getBySection
  };
};

export const useMovie = (movieId: string) => {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!movieId) return;

    const movieRef = ref(database, `movies/${movieId}`);
    
    const unsubscribe = onValue(movieRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMovie({ id: movieId, ...data });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [movieId]);

  return { movie, loading };
};
