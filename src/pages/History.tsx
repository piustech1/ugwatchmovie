import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Play, Trash2, ArrowLeft } from "lucide-react";
import { ref, onValue, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";

interface HistoryItem {
  movieId: string;
  title: string;
  poster: string;
  progress: number;
  currentTime: number;
  duration: number;
  timestamp: number;
  isSeries?: boolean;
  episode?: {
    season: string;
    episode: string;
    title: string;
  };
}

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const historyRef = ref(database, `users/${user.uid}/continueWatching`);
    const unsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.entries(data)
          .map(([movieId, item]) => ({
            movieId,
            ...(item as Omit<HistoryItem, "movieId">)
          }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setHistory(items);
      } else {
        setHistory([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const removeFromHistory = async (movieId: string) => {
    if (!user) return;
    const itemRef = ref(database, `users/${user.uid}/continueWatching/${movieId}`);
    await remove(itemRef);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">Sign in to view your watch history</p>
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="pt-16 pb-24 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Watch History</h1>
            <p className="text-sm text-muted-foreground">{history.length} items</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No Watch History</h2>
            <p className="text-muted-foreground text-sm">Movies you watch will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item, index) => (
              <motion.div
                key={item.movieId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl overflow-hidden border border-border"
              >
                <div className="flex gap-3 p-3">
                  {/* Thumbnail */}
                  <div 
                    className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                    onClick={() => navigate(`/movie/${item.movieId}`)}
                  >
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="w-6 h-6 text-white" fill="white" />
                    </div>
                    {/* Progress bar on thumbnail */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="font-medium text-foreground text-sm truncate cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/movie/${item.movieId}`)}
                    >
                      {item.title}
                    </h3>
                    {item.episode && (
                      <p className="text-xs text-muted-foreground">
                        S{item.episode.season} E{item.episode.episode}: {item.episode.title}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{formatTime(item.currentTime)} / {formatTime(item.duration)}</span>
                      <span>•</span>
                      <span>{item.progress}% watched</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(item.timestamp)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => navigate(`/movie/${item.movieId}`)}
                      className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromHistory(item.movieId)}
                      className="p-2 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default History;
