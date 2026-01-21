import { useState, useEffect, useCallback } from "react";
import { ref, set, onValue, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export interface ContinueWatchingItem {
  movieId: string;
  title: string;
  poster: string;
  backdrop: string;
  progress: number; // percentage 0-100
  currentTime: number; // seconds
  duration: number; // seconds
  timestamp: number;
  isSeries?: boolean;
  episode?: {
    season: string;
    episode: string;
    title: string;
  };
}

export const useContinueWatching = () => {
  const { user } = useAuth();
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setContinueWatching([]);
      setLoading(false);
      return;
    }

    const cwRef = ref(database, `users/${user.uid}/continueWatching`);
    
    const unsubscribe = onValue(cwRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.entries(data)
          .map(([movieId, item]) => ({
            movieId,
            ...(item as Omit<ContinueWatchingItem, "movieId">)
          }))
          .filter(item => item.progress < 95) // Hide completed
          .sort((a, b) => b.timestamp - a.timestamp);
        setContinueWatching(items);
      } else {
        setContinueWatching([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const saveProgress = useCallback(async (
    movieId: string,
    title: string,
    poster: string,
    backdrop: string,
    currentTime: number,
    duration: number,
    isSeries?: boolean,
    episode?: ContinueWatchingItem["episode"]
  ) => {
    if (!user || !duration) return;

    const progress = Math.round((currentTime / duration) * 100);
    
    const cwRef = ref(database, `users/${user.uid}/continueWatching/${movieId}`);
    await set(cwRef, {
      title,
      poster,
      backdrop,
      progress,
      currentTime,
      duration,
      timestamp: Date.now(),
      isSeries: isSeries || false,
      episode: episode || null
    });
  }, [user]);

  const removeFromContinueWatching = useCallback(async (movieId: string) => {
    if (!user) return;
    
    const cwRef = ref(database, `users/${user.uid}/continueWatching/${movieId}`);
    await remove(cwRef);
  }, [user]);

  const getProgress = useCallback((movieId: string) => {
    return continueWatching.find(item => item.movieId === movieId);
  }, [continueWatching]);

  return {
    continueWatching,
    loading,
    saveProgress,
    removeFromContinueWatching,
    getProgress
  };
};
