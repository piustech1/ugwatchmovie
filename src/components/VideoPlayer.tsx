import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Gauge, PictureInPicture, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  onError?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  autoPlay?: boolean;
  initialTime?: number;
  startPlayingImmediately?: boolean;
}

export interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  togglePiP: () => Promise<void>;
  setPlaybackSpeed: (speed: number) => void;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({
  src,
  title,
  poster,
  onError,
  onTimeUpdate,
  autoPlay = false,
  initialTime = 0,
  startPlayingImmediately = false
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSetInitialTimeRef = useRef(false);
  const userInteractedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);

  // Gesture states for brightness/volume swipe
  const [brightness, setBrightness] = useState(1);
  const [showGestureIndicator, setShowGestureIndicator] = useState<{ type: 'volume' | 'brightness'; value: number } | null>(null);
  const gestureStartRef = useRef<{ x: number; y: number; side: 'left' | 'right'; startValue: number } | null>(null);
  const gestureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  }, []);

  const changePlaybackSpeed = useCallback((speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    seek: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    getCurrentTime: () => videoRef.current?.currentTime || 0,
    getDuration: () => videoRef.current?.duration || 0,
    togglePiP,
    setPlaybackSpeed: changePlaybackSpeed
  }));

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    hasSetInitialTimeRef.current = false;
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      
      if (!hasSetInitialTimeRef.current && initialTime > 0) {
        video.currentTime = initialTime;
        hasSetInitialTimeRef.current = true;
      }
      
      if (startPlayingImmediately || autoPlay) {
        video.play().catch(console.error);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime, video.duration);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      onError?.();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [src, initialTime, startPlayingImmediately, autoPlay, onTimeUpdate, onError]);

  useEffect(() => {
    setIsPiPSupported(document.pictureInPictureEnabled);

    const handlePiPChange = () => {
      setIsPiPActive(!!document.pictureInPictureElement);
    };

    document.addEventListener('enterpictureinpicture', handlePiPChange);
    document.addEventListener('leavepictureinpicture', handlePiPChange);

    return () => {
      document.removeEventListener('enterpictureinpicture', handlePiPChange);
      document.removeEventListener('leavepictureinpicture', handlePiPChange);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          skip(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const adjustVolume = (delta: number) => {
    if (videoRef.current) {
      const newVolume = Math.max(0, Math.min(1, volume + delta));
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = percent * duration;
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        // Unlock screen orientation when exiting fullscreen
        try {
          const orientation = screen.orientation as ScreenOrientation & { unlock?: () => void };
          if (orientation.unlock) {
            orientation.unlock();
          }
        } catch (e) {
          // Orientation unlock may not be supported
        }
      } else {
        await containerRef.current.requestFullscreen();
        // Force landscape mode when entering fullscreen
        try {
          const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
          if (orientation.lock) {
            await orientation.lock('landscape');
          }
        } catch (e) {
          // Orientation lock may not be supported on all devices/browsers
          console.log('Orientation lock not supported:', e);
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Gesture handlers for brightness/volume swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeX = touch.clientX - rect.left;
    const side = relativeX < rect.width / 2 ? 'left' : 'right';
    const startValue = side === 'left' ? brightness : volume;

    gestureStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      side,
      startValue
    };
  }, [brightness, volume]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!gestureStartRef.current) return;

    const touch = e.touches[0];
    const deltaY = gestureStartRef.current.y - touch.clientY;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate value change based on vertical movement
    const sensitivity = 0.005; // Adjust sensitivity
    const valueChange = deltaY * sensitivity;
    const newValue = Math.max(0, Math.min(1, gestureStartRef.current.startValue + valueChange));

    if (gestureStartRef.current.side === 'left') {
      // Brightness control
      setBrightness(newValue);
      setShowGestureIndicator({ type: 'brightness', value: newValue });
    } else {
      // Volume control
      if (videoRef.current) {
        videoRef.current.volume = newValue;
        setVolume(newValue);
        setIsMuted(newValue === 0);
      }
      setShowGestureIndicator({ type: 'volume', value: newValue });
    }

    // Reset gesture indicator timeout
    if (gestureTimeoutRef.current) {
      clearTimeout(gestureTimeoutRef.current);
    }
    gestureTimeoutRef.current = setTimeout(() => {
      setShowGestureIndicator(null);
    }, 1000);
  }, []);

  const handleTouchEnd = useCallback(() => {
    gestureStartRef.current = null;
    if (gestureTimeoutRef.current) {
      clearTimeout(gestureTimeoutRef.current);
      gestureTimeoutRef.current = setTimeout(() => {
        setShowGestureIndicator(null);
      }, 1000);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden group"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'VIDEO') {
          togglePlayPause();
        }
      }}
      style={{ filter: `brightness(${brightness})` }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
      />

      {/* Gesture Indicator */}
      <AnimatePresence>
        {showGestureIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center gap-2 z-30"
          >
            {showGestureIndicator.type === 'brightness' ? (
              <Sun className="w-8 h-8 text-yellow-400" />
            ) : (
              <Volume2 className="w-8 h-8 text-white" />
            )}
            <div className="w-24 h-2 bg-white/30 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${showGestureIndicator.type === 'brightness' ? 'bg-yellow-400' : 'bg-white'}`}
                style={{ width: `${showGestureIndicator.value * 100}%` }}
              />
            </div>
            <span className="text-white text-sm font-medium">
              {Math.round(showGestureIndicator.value * 100)}%
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Center Play Button */}
      <AnimatePresence>
        {!isPlaying && !isLoading && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center hover:bg-primary transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
          >
            <Play className="w-8 h-8 text-primary-foreground fill-current ml-1" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls || !isPlaying ? 1 : 0 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-12 pb-[calc(0.75rem+env(safe-area-inset-bottom))] px-3 sm:px-4"
        >
          {/* Title */}
          {title && (
            <div className="mb-2">
              <h3 className="text-white font-medium text-xs sm:text-sm truncate">{title}</h3>
            </div>
          )}

          {/* Progress Bar */}
          <div
            ref={progressRef}
            className="relative h-1.5 bg-white/30 rounded-full cursor-pointer group/progress mb-3"
            onClick={handleProgressClick}
          >
            {/* Buffered */}
            <div
              className="absolute h-full bg-white/40 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            {/* Progress */}
            <div
              className="absolute h-full bg-primary rounded-full"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
            {/* Handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg"
              style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 6px)` }}
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
              {/* Play/Pause */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className="p-1.5 sm:p-2 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-current" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-current" />
                )}
              </button>

              {/* Skip Backward */}
              <button
                onClick={() => skip(-10)}
                className="p-1.5 sm:p-2 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => skip(10)}
                className="p-1.5 sm:p-2 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>

              {/* Volume - Hidden on very small screens */}
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={toggleMute}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  ) : (
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-14 sm:w-16 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Time Display */}
              <span className="text-white text-[10px] sm:text-xs font-medium whitespace-nowrap ml-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Playback Speed */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className={`p-1.5 sm:p-2 rounded-full hover:bg-white/20 transition-colors flex items-center gap-0.5 ${playbackSpeed !== 1 ? 'bg-primary/50' : ''}`}
                  title="Playback Speed"
                >
                  <Gauge className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  <span className="text-[10px] sm:text-xs text-white font-medium">{playbackSpeed}x</span>
                </button>
                
                <AnimatePresence>
                  {showSpeedMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden z-40"
                    >
                      {PLAYBACK_SPEEDS.map((speed) => (
                        <button
                          key={speed}
                          onClick={() => changePlaybackSpeed(speed)}
                          className={`block w-full px-4 py-2 text-left text-sm hover:bg-white/20 transition-colors ${
                            playbackSpeed === speed ? 'text-primary bg-white/10' : 'text-white'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Picture in Picture */}
              {isPiPSupported && (
                <button
                  onClick={togglePiP}
                  className={`p-1.5 sm:p-2 rounded-full hover:bg-white/20 transition-colors ${isPiPActive ? 'bg-primary/50' : ''}`}
                  title="Picture in Picture"
                >
                  <PictureInPicture className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </button>
              )}

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 sm:p-2 rounded-full hover:bg-white/20 transition-colors"
                title="Fullscreen"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
