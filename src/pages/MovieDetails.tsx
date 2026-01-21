import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Share2, 
  Download, 
  Heart,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import MainLayout from '@/components/MainLayout';
import VideoPlayer, { VideoPlayerRef } from '@/components/VideoPlayer';
import ContentRow from '@/components/ContentRow';
import { useMovie, useMovies } from '@/hooks/useMovies';
import { useFavorites } from '@/hooks/useFavorites';
import { useContinueWatching } from '@/hooks/useContinueWatching';
import { useToast } from '@/hooks/use-toast';
import { useDownloads } from '@/hooks/useDownloads';

interface SelectedEpisode {
  season: string;
  episodeKey: string;
  title: string;
  streamUrl: string;
  backdrop?: string;
}

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { movie, loading: movieLoading } = useMovie(id || '');
  const { movies: allMovies } = useMovies();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getProgress, saveProgress, removeFromContinueWatching } = useContinueWatching();
  const { addDownload, updateDownloadProgress, completeDownload, failDownload } = useDownloads();
  const videoPlayerRef = useRef<VideoPlayerRef>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [useIframe, setUseIframe] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<SelectedEpisode | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [initialPlaybackTime, setInitialPlaybackTime] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const isSeries = movie?.isSeries;
  const currentStreamUrl = selectedEpisode?.streamUrl || movie?.streamUrl;
  const currentBackdrop = selectedEpisode?.backdrop || movie?.backdrop || movie?.poster;

  const backendUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const proxiedStreamUrl = currentStreamUrl && backendUrl
    ? `${backendUrl}/functions/v1/video-proxy?url=${encodeURIComponent(currentStreamUrl)}`
    : (currentStreamUrl || '');

  // Get saved progress
  const savedProgress = movie ? getProgress(movie.id) : undefined;

  // Check if should resume
  const shouldResume = savedProgress && 
    savedProgress.progress > 5 && 
    savedProgress.progress < 95;

  const formatResumeTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handlePlay = useCallback((resume: boolean = false) => {
    if (resume && savedProgress) {
      setInitialPlaybackTime(savedProgress.currentTime);
    } else {
      setInitialPlaybackTime(0);
      if (movie) {
        removeFromContinueWatching(movie.id);
      }
    }
    setVideoError(false);
    setIsPlaying(true);
  }, [savedProgress, movie, removeFromContinueWatching]);

  const handleVideoTimeUpdate = useCallback((currentTime: number, duration: number) => {
    if (!movie || !duration || duration === 0) return;
    
    const episodeData = selectedEpisode ? {
      season: selectedEpisode.season,
      episode: selectedEpisode.episodeKey,
      title: selectedEpisode.title
    } : undefined;
    
    saveProgress(
      movie.id,
      selectedEpisode ? `${movie.title} - ${selectedEpisode.title}` : movie.title,
      movie.poster || '',
      movie.backdrop || '',
      currentTime,
      duration,
      isSeries,
      episodeData
    );
  }, [movie, selectedEpisode, saveProgress, isSeries]);

  const handleShare = async () => {
    const shareData = {
      title: movie?.title,
      text: `Check out ${movie?.title} on UgaWatch!`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Share link copied to clipboard"
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleDownload = async () => {
    if (!currentStreamUrl || isDownloading || !movie) return;
    
    setIsDownloading(true);
    
    // Add to downloads tracker
    const episodeInfo = selectedEpisode ? {
      season: selectedEpisode.season,
      episode: selectedEpisode.episodeKey,
      title: selectedEpisode.title
    } : undefined;
    
    const downloadId = addDownload(
      movie.id,
      movie.title,
      movie.poster || '',
      movie.backdrop,
      episodeInfo
    );
    
    toast({
      title: "Download started",
      description: "Your download will begin shortly..."
    });

    try {
      const response = await fetch(proxiedStreamUrl);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');
      
      const chunks: BlobPart[] = [];
      let receivedLength = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value as BlobPart);
        receivedLength += value.length;
        
        // Update progress
        if (totalSize > 0) {
          const progress = Math.round((receivedLength / totalSize) * 100);
          updateDownloadProgress(downloadId, progress);
        }
      }
      
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${movie.title}${selectedEpisode ? ` - ${selectedEpisode.title}` : ''}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Mark as complete
      completeDownload(downloadId, receivedLength);
      
      toast({
        title: "Download complete!",
        description: `${movie.title} has been downloaded`
      });
    } catch (error) {
      console.error('Download error:', error);
      failDownload(downloadId);
      toast({
        title: "Download failed",
        description: "Unable to download this video. Try opening in a new tab.",
        variant: "destructive"
      });
      
      // Fallback: open in new tab for manual download
      window.open(currentStreamUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const getSeasonNumberFromKey = (key: string) => {
    const m = key.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  };

  const getEpisodeNumberFromKey = (key: string) => {
    const m = key.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  };

  const handleEpisodeSelect = (season: string, episodeKey: string, episode: any) => {
    const epNum = getEpisodeNumberFromKey(episodeKey);

    setSelectedEpisode({
      season,
      episodeKey,
      title: episode.title || `Episode ${epNum || episodeKey}`,
      streamUrl: episode.streamUrl,
      backdrop: episode.backdrop || movie?.backdrop
    });
    
    setInitialPlaybackTime(0);
    setVideoError(false);
    setIsPlaying(true);
  };

  // Keys are stored like "season_1" and "episode_1" in Firebase
  const getSeasons = (): string[] => {
    if (!movie?.episodes || typeof movie.episodes !== "object") return [];

    return Object.keys(movie.episodes).sort(
      (a, b) => getSeasonNumberFromKey(a) - getSeasonNumberFromKey(b)
    );
  };

  const seasons = getSeasons();

  // Ensure we always point at a real season key (e.g. "season_1")
  useEffect(() => {
    if (!isSeries) return;
    if (seasons.length === 0) return;

    if (!selectedSeason || !seasons.includes(selectedSeason)) {
      setSelectedSeason(seasons[0]);
    }
  }, [isSeries, seasons, selectedSeason]);

  const getEpisodes = (): [string, any][] => {
    if (!movie?.episodes || typeof movie.episodes !== "object") return [];

    const seasonKey =
      selectedSeason && (movie.episodes as any)[selectedSeason]
        ? selectedSeason
        : seasons[0];

    if (!seasonKey) return [];

    const seasonData = (movie.episodes as any)[seasonKey];
    if (!seasonData || typeof seasonData !== "object") return [];

    return Object.entries(seasonData).sort(
      ([a], [b]) => getEpisodeNumberFromKey(a) - getEpisodeNumberFromKey(b)
    );
  };

  const episodes = getEpisodes();

  // Similar movies - use flexible genre matching (partial match or any genre overlap)
  const getSimilarMovies = () => {
    if (!allMovies || !movie) return [];
    
    const currentGenres = movie.genre?.toLowerCase().split(/[,\s]+/).filter(Boolean) || [];
    
    // First try to find movies with matching genres
    let similar = allMovies.filter(m => {
      if (m.id === movie.id) return false;
      if (!m.genre) return false;
      
      const movieGenres = m.genre.toLowerCase().split(/[,\s]+/).filter(Boolean);
      return currentGenres.some(g => movieGenres.includes(g));
    });
    
    // If no matches, fall back to other movies (excluding current)
    if (similar.length === 0) {
      similar = allMovies.filter(m => m.id !== movie.id);
    }
    
    return similar.slice(0, 12);
  };
  
  const similarMovies = getSimilarMovies();

  if (movieLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Content Not Found</h1>
        <p className="text-muted-foreground mb-4">Unable to load this content</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const favorite = isFavorite(movie.id);

  return (
    <MainLayout showTopNav={true}>
      {/* Content wrapper with top padding for TopNav */}
      <div className="pt-14">
        {/* Back Button - positioned below TopNav */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-16 left-3 z-30 p-2.5 rounded-full bg-black/70 backdrop-blur-sm hover:bg-black/90 transition-colors border border-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Video Player or Backdrop */}
        <div className="relative w-full">
          {isPlaying && currentStreamUrl ? (
            <div className="w-full h-[42vh] sm:h-[55vh] md:h-[60vh] bg-black">
            {useIframe ? (
              <iframe
                title={`${movie.title} player`}
                src={proxiedStreamUrl}
                className="w-full h-full border-0"
                allowFullScreen
                allow="autoplay; encrypted-media; fullscreen"
              />
            ) : (
              <>
                <VideoPlayer
                  ref={videoPlayerRef}
                  src={proxiedStreamUrl}
                  title={selectedEpisode ? `${movie.title} - ${selectedEpisode.title}` : movie.title}
                  poster={currentBackdrop}
                  onError={() => setVideoError(true)}
                  onTimeUpdate={handleVideoTimeUpdate}
                  initialTime={initialPlaybackTime}
                  startPlayingImmediately={true}
                />
                {videoError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90">
                    <AlertCircle className="w-10 h-10 text-destructive mb-3" />
                    <p className="text-muted-foreground text-sm mb-3">Video failed to load</p>
                    <Button
                      size="sm"
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
          <div className="w-full aspect-video relative overflow-hidden">
            <img
              src={currentBackdrop}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            
            {/* Play Button Overlay */}
            <button
              onClick={() => handlePlay(false)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center hover:bg-primary transition-all hover:scale-110"
            >
              <Play className="w-7 h-7 text-primary-foreground fill-current ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Movie Info Card */}
      <div className="relative z-10 mt-3 mx-3 sm:mx-4">
        <div className="bg-card/95 backdrop-blur-sm rounded-2xl border border-border/50 p-4 sm:p-5 shadow-xl">
          {/* Title & Meta */}
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{movie.title}</h1>
          
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-4">
            {movie.year && <span>{movie.year}</span>}
            {movie.rating && (
              <>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span className="text-yellow-500">★ {movie.rating}</span>
              </>
            )}
            {movie.vj && (
              <>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span>VJ: {movie.vj}</span>
              </>
            )}
            {isSeries && seasons.length > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <Badge variant="secondary" className="text-xs">{seasons.length} Seasons</Badge>
              </>
            )}
          </div>

          {/* Genres */}
          {movie.genre && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              <Badge variant="outline" className="text-xs">
                {movie.genre}
              </Badge>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mb-4">
            {shouldResume ? (
              <Button 
                onClick={() => handlePlay(true)} 
                className="flex-1 h-11 text-sm font-semibold"
              >
                <Play className="w-4 h-4 mr-2 fill-current" />
                Resume at {formatResumeTime(savedProgress!.currentTime)}
              </Button>
            ) : (
              <Button 
                onClick={() => handlePlay(false)} 
                className="flex-1 h-11 text-sm font-semibold"
              >
                <Play className="w-4 h-4 mr-2 fill-current" />
                {isPlaying ? 'Playing' : 'Play'}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 flex-shrink-0"
              onClick={() => toggleFavorite(movie)}
            >
              <Heart className={`w-5 h-5 ${favorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 flex-shrink-0"
              onClick={handleShare}
            >
              <Share2 className="w-5 h-5" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 flex-shrink-0"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Description */}
          {movie.description && (
            <div className="mb-4">
              <p className={`text-sm text-muted-foreground leading-relaxed ${!showFullDescription ? 'line-clamp-3' : ''}`}>
                {movie.description}
              </p>
              {movie.description.length > 150 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-primary text-sm font-medium mt-1 flex items-center gap-1"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFullDescription ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Series Episodes */}
      {isSeries && (
        <div className="px-3 sm:px-4 mt-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Episodes</h2>
          
          {/* Season Selector */}
          {seasons.length > 1 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              {seasons.map((season) => (
                <Button
                  key={season}
                  variant={selectedSeason === season ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSeason(season)}
                  className="flex-shrink-0"
                >
                  Season {getSeasonNumberFromKey(season)}
                </Button>
              ))}
            </div>
          )}

          {/* Episodes List */}
          {episodes.length > 0 ? (
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-4">
                {episodes.map(([episodeKey, episode]) => {
                  const isCurrentEpisode = selectedEpisode?.episodeKey === episodeKey && selectedEpisode?.season === selectedSeason;
                  
                  return (
                    <button
                      key={episodeKey}
                      onClick={() => handleEpisodeSelect(selectedSeason, episodeKey, episode)}
                      className={`flex-shrink-0 w-40 sm:w-48 rounded-lg overflow-hidden border transition-all ${
                        isCurrentEpisode 
                          ? 'border-primary ring-2 ring-primary/50' 
                          : 'border-border/50 hover:border-border'
                      }`}
                    >
                      <div className="relative aspect-video">
                        <img
                          src={episode.backdrop || movie.backdrop || movie.poster}
                          alt={episode.title || `Episode ${getEpisodeNumberFromKey(episodeKey)}`}
                          className="w-full h-full object-cover"
                        />
                        {isCurrentEpisode && isPlaying && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="p-2 bg-card">
                        <p className="text-xs font-medium text-foreground truncate">
                          Ep {getEpisodeNumberFromKey(episodeKey)}: {episode.title || `Episode ${getEpisodeNumberFromKey(episodeKey)}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-sm">No episodes available for this season.</p>
          )}
        </div>
      )}

      {/* More Like This */}
      {similarMovies.length > 0 && (
        <div className="mt-6 pb-4">
          <ContentRow 
            title="More Like This" 
            movies={similarMovies}
          />
        </div>
      )}
      
      {/* Fallback if no similar movies - show some content */}
      {similarMovies.length === 0 && allMovies && allMovies.length > 1 && (
        <div className="mt-6 pb-4">
          <ContentRow 
            title="You May Also Like" 
            movies={allMovies.filter(m => m.id !== movie?.id).slice(0, 12)}
          />
        </div>
      )}
      </div>
    </MainLayout>
  );
};

export default MovieDetails;
