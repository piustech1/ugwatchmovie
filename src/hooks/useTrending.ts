import { useState, useEffect, useMemo } from "react";
import { ref, onValue, update, increment } from "firebase/database";
import { database } from "@/lib/firebase";
import { Movie } from "./useMovies";

interface ViewData {
  movieId: string;
  timestamp: number;
  type: 'play' | 'visit';
}

interface MovieStats {
  totalViews: number;
  weeklyViews: number;
  todayViews: number;
  recentVelocity: number; // views per hour in last 24h
  trendingScore: number;
}

export const useTrending = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [viewStats, setViewStats] = useState<Record<string, MovieStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const moviesRef = ref(database, "movies");
    const viewsRef = ref(database, "movieViews");

    const unsubscribeMovies = onValue(moviesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const moviesArray = Object.entries(data).map(([id, movie]) => ({
          id,
          ...(movie as Omit<Movie, "id">)
        }));
        setMovies(moviesArray);
      }
      setLoading(false);
    });

    const unsubscribeViews = onValue(viewsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
        const todayStart = new Date().setHours(0, 0, 0, 0);

        const stats: Record<string, MovieStats> = {};

        Object.entries(data).forEach(([movieId, views]) => {
          const viewList = Object.values(views as Record<string, ViewData>);
          
          const totalViews = viewList.length;
          const weeklyViews = viewList.filter(v => v.timestamp > oneWeekAgo).length;
          const todayViews = viewList.filter(v => v.timestamp > todayStart).length;
          const last24hViews = viewList.filter(v => v.timestamp > oneDayAgo).length;
          const recentVelocity = last24hViews / 24;

          // Trending score formula:
          // - Recent velocity (high weight for rapidly watched)
          // - Weekly views (sustained popularity)
          // - Today's views (current interest)
          // - Recency bonus for new uploads
          const trendingScore = 
            (recentVelocity * 50) + 
            (weeklyViews * 2) + 
            (todayViews * 10);

          stats[movieId] = {
            totalViews,
            weeklyViews,
            todayViews,
            recentVelocity,
            trendingScore
          };
        });

        setViewStats(stats);
      }
    });

    return () => {
      unsubscribeMovies();
      unsubscribeViews();
    };
  }, []);

  const trendingMovies = useMemo(() => {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    return movies
      .map(movie => {
        const stats = viewStats[movie.id] || {
          totalViews: movie.views || 0,
          weeklyViews: 0,
          todayViews: 0,
          recentVelocity: 0,
          trendingScore: 0
        };

        // Bonus for recently uploaded movies that are getting views
        const uploadRecency = movie.uploadDate ? (now - movie.uploadDate) / (24 * 60 * 60 * 1000) : 30;
        const recencyBonus = uploadRecency < 7 ? (7 - uploadRecency) * 5 : 0;

        // Use existing views as fallback
        const baseScore = stats.trendingScore || (movie.views || 0) * 0.5;
        const finalScore = baseScore + recencyBonus;

        return {
          ...movie,
          stats: {
            ...stats,
            trendingScore: finalScore
          }
        };
      })
      .filter(movie => {
        // Only include movies with some activity
        const stats = movie.stats;
        return stats.trendingScore > 0 || (movie.views || 0) > 0;
      })
      .sort((a, b) => b.stats.trendingScore - a.stats.trendingScore)
      .slice(0, 50); // Top 50 trending
  }, [movies, viewStats]);

  // Track a view/play
  const trackView = async (movieId: string, type: 'play' | 'visit' = 'visit') => {
    try {
      const viewRef = ref(database, `movieViews/${movieId}/${Date.now()}`);
      await update(ref(database), {
        [`movieViews/${movieId}/${Date.now()}`]: {
          movieId,
          timestamp: Date.now(),
          type
        },
        [`movies/${movieId}/views`]: increment(1)
      });
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  return {
    trendingMovies,
    loading,
    trackView,
    viewStats
  };
};

export type { MovieStats };
