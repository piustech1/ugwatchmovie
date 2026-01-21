import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowLeft, AlertTriangle, MessageCircle, Play, X, Star, Calendar, Film, Share2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { SkeletonRow } from "@/components/Skeletons";
import { Movie } from "@/hooks/useMovies";
import { toast } from "sonner";

const DEFAULT_PIN = "pik1";

const AdultZone = () => {
  const navigate = useNavigate();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [adultContent, setAdultContent] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [useIframe, setUseIframe] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    const unlocked = sessionStorage.getItem("adultUnlocked") === "true";
    setIsUnlocked(unlocked);
  }, []);

  useEffect(() => {
    if (!isUnlocked) {
      setLoading(false);
      return;
    }

    const contentRef = ref(database, "adultContent");
    const unsubscribe = onValue(contentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const contentList = Object.entries(data).map(([id, content]: [string, any]) => ({
          id,
          ...content,
        }));
        setAdultContent(contentList);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isUnlocked]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === DEFAULT_PIN) {
      setIsUnlocked(true);
      sessionStorage.setItem("adultUnlocked", "true");
      setError("");
    } else {
      setError("Incorrect PIN. Please try again.");
      setPin("");
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem("adultUnlocked");
    setSelectedMovie(null);
    setIsPlaying(false);
  };

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsPlaying(false);
    setVideoError(false);
    setUseIframe(false);
    setShowFullDescription(false);
  };

  const handleShare = async () => {
    if (!selectedMovie) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedMovie.title,
          text: `Watch ${selectedMovie.title}`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const startPlayback = () => {
    // Trigger Android advertisement bridge
    if (typeof (window as any).Android?.sendData === "function") {
      (window as any).Android.sendData("Advertisement");
    }

    setVideoError(false);
    setUseIframe(false);
    setIsPlaying(true);
  };

  const proxiedStreamUrl = selectedMovie?.streamUrl
    ? `https://zfcsumtxuxgyxkabwatt.supabase.co/functions/v1/video-proxy?url=${encodeURIComponent(selectedMovie.streamUrl)}`
    : "";

  // Truncate description
  const maxDescLength = 200;
  const description = selectedMovie?.description || "";
  const isLongDescription = description.length > maxDescLength;
  const displayDescription = showFullDescription
    ? description
    : description.slice(0, maxDescLength) + (isLongDescription ? "..." : "");

  if (!isUnlocked) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm"
          >
            <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-xl font-bold text-foreground mb-1">Adult Zone</h1>
                <p className="text-sm text-muted-foreground">Enter PIN to access 18+ content</p>
              </div>

              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter PIN"
                    className="w-full h-12 px-4 rounded-xl bg-muted border border-border text-foreground text-center text-lg tracking-widest placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    autoFocus
                  />
                  {error && (
                    <p className="text-destructive text-sm mt-2 text-center flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {error}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
                >
                  Unlock
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-border">
                <a
                  href="https://wa.me/256709728322?text=I%20need%20the%20Adult%20Zone%20PIN"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Request PIN
                </a>
              </div>
            </div>

            <button
              onClick={() => navigate(-1)}
              className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Go Back
            </button>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  // Movie Details View
  if (selectedMovie) {
    return (
      <MainLayout>
        <div className="min-h-screen pb-4">
          {/* Back Button */}
          <button
            onClick={() => {
              setSelectedMovie(null);
              setIsPlaying(false);
            }}
            className="fixed top-4 left-4 z-50 p-2 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>

          {/* Lock Button */}
          <button
            onClick={handleLock}
            className="fixed top-4 right-4 z-50 px-3 py-2 rounded-full bg-rose-500/20 backdrop-blur-sm hover:bg-rose-500/30 transition-colors flex items-center gap-1.5"
          >
            <Lock className="w-4 h-4 text-rose-400" />
            <span className="text-sm text-rose-400 font-medium">Lock</span>
          </button>

          {/* Video Player or Backdrop */}
          <div className="relative h-[50vh] md:h-[60vh]">
            {isPlaying && selectedMovie.streamUrl ? (
              <div className="w-full h-full bg-black relative">
                {useIframe ? (
                  <iframe
                    title={`${selectedMovie.title} player`}
                    src={proxiedStreamUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                    allow="autoplay; encrypted-media; fullscreen"
                  />
                ) : (
                  <>
                    <video
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full"
                      onError={() => setVideoError(true)}
                    >
                      <source src={proxiedStreamUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    {videoError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                        <p className="text-muted-foreground mb-4">Video failed to load</p>
                        <Button
                          onClick={() => {
                            setVideoError(false);
                            setUseIframe(true);
                          }}
                        >
                          Try Alternative Player
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                <img
                  src={selectedMovie.backdrop || selectedMovie.poster}
                  alt={selectedMovie.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

                {/* Play Button Overlay */}
                <button
                  onClick={startPlayback}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-2xl"
                  >
                    <Play className="w-8 h-8 text-white fill-current ml-1" />
                  </motion.div>
                </button>
              </>
            )}
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative -mt-10 px-4"
          >
            <div className="bg-card rounded-t-2xl p-4 md:p-6">
              {/* Title */}
              <div className="flex items-start justify-between mb-3">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {selectedMovie.title}
                </h1>
                <span className="px-2 py-1 bg-rose-500/20 text-rose-400 text-xs font-bold rounded">
                  18+
                </span>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                {selectedMovie.rating && (
                  <div className="flex items-center gap-1 text-rose-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{selectedMovie.rating}</span>
                  </div>
                )}
                {selectedMovie.year && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{selectedMovie.year}</span>
                  </div>
                )}
                {selectedMovie.genre && (
                  <div className="flex items-center gap-1">
                    <Film className="w-4 h-4" />
                    <span>{selectedMovie.genre}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <Button
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
                  onClick={startPlayback}
                >
                  <Play className="w-5 h-5 fill-current" />
                  Play Now
                </Button>
                <Button variant="outline" size="icon" className="w-12 h-12" onClick={handleShare}>
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>

              {/* Description */}
              {selectedMovie.description && (
                <div className="mb-6 p-4 bg-muted/50 rounded-xl">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Film className="w-4 h-4 text-rose-400" />
                    Overview
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {displayDescription}
                  </p>
                  {isLongDescription && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-rose-400 text-sm font-medium mt-2"
                    >
                      {showFullDescription ? "Show Less" : "Read More"}
                    </button>
                  )}
                </div>
              )}

              {/* More Content */}
              {adultContent.filter(m => m.id !== selectedMovie.id).length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-3">More Content</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {adultContent
                      .filter(m => m.id !== selectedMovie.id)
                      .slice(0, 6)
                      .map((movie) => (
                        <motion.button
                          key={movie.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleMovieSelect(movie)}
                          className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted group"
                        >
                          <img
                            src={movie.poster || "/placeholder.svg"}
                            alt={movie.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  // Grid View
  return (
    <MainLayout>
      <div className="pt-16 pb-8">
        {/* Header */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-500" />
                <h1 className="text-xl font-bold text-foreground">Adult Zone</h1>
                <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] rounded font-bold">18+</span>
              </div>
            </div>
            <button
              onClick={handleLock}
              className="px-3 py-1.5 bg-muted rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Lock
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <SkeletonRow />
        ) : adultContent.length > 0 ? (
          <div className="px-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {adultContent.map((movie, index) => (
                <motion.button
                  key={movie.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="cursor-pointer group text-left"
                  onClick={() => handleMovieSelect(movie)}
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted">
                    <img
                      src={movie.poster || "/placeholder.svg"}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-rose-500/90 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-medium text-foreground truncate">
                    {movie.title}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">No Content Available</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Adult content will appear here when available.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdultZone;
