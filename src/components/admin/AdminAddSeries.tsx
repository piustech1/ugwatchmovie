import { useState } from "react";
import { Search, Loader2, Tv, Check, Film, Info, Save, Upload } from "lucide-react";
import { ref, push, set, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { supabase } from "@/integrations/supabase/client";
import { 
  searchTVShows, 
  getTVShowDetails, 
  getSeasonEpisodes, 
  getImageUrl, 
  TMDBMovie, 
  TMDBTVShowDetails, 
  TMDBEpisode 
} from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EpisodeWithUrl extends TMDBEpisode {
  streamUrl: string;
  saved?: boolean;
}

const AdminAddSeries = () => {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Selected series state
  const [selectedShow, setSelectedShow] = useState<TMDBTVShowDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Season selection state
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [episodes, setEpisodes] = useState<EpisodeWithUrl[]>([]);
  
  // Form state
  const [vj, setVj] = useState("");
  const [genre, setGenre] = useState("");
  const [section, setSection] = useState("popular");
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingEpisode, setSavingEpisode] = useState<number | null>(null);
  const [savingWithoutLinks, setSavingWithoutLinks] = useState(false);

  // Send push notification to all users
  const sendPushToAllUsers = async (title: string, body: string, imageUrl?: string, seriesId?: string) => {
    try {
      // Get all FCM tokens from Firebase
      const tokensRef = ref(database, "fcmTokens");
      const snapshot = await get(tokensRef);
      
      if (!snapshot.exists()) {
        console.log("No FCM tokens found in database");
        return;
      }

      const tokensData = snapshot.val();
      const tokens: string[] = [];
      
      // Extract tokens properly - filter out invalid entries
      Object.values(tokensData).forEach((item: any) => {
        if (item && item.token && typeof item.token === 'string' && item.token.length > 10) {
          tokens.push(item.token);
        }
      });
      
      if (tokens.length === 0) {
        console.log("No valid tokens found after filtering");
        return;
      }

      console.log(`Sending push to ${tokens.length} devices for new series`);

      // Call edge function
      const { data, error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          tokens,
          title,
          body,
          image: imageUrl || undefined,
          data: {
            movieId: seriesId || "",
            link: seriesId ? `/movie/${seriesId}` : "/",
            type: "new_content",
          },
        },
      });

      if (error) {
        console.error("Push notification error:", error);
      } else {
        console.log("Push notification result:", data);
      }
    } catch (error) {
      console.error("Error sending push notifications:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setSelectedShow(null);
    setSelectedSeasonNumber(null);
    setEpisodes([]);
    
    try {
      const results = await searchTVShows(searchQuery);
      setSearchResults(results.slice(0, 10));
    } catch (error) {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectShow = async (item: TMDBMovie) => {
    setLoadingDetails(true);
    setSearchResults([]);
    setSearchQuery("");
    setSelectedSeasonNumber(null);
    setEpisodes([]);
    
    try {
      const details = await getTVShowDetails(item.id);
      if (details) {
        // Filter out season 0 (specials) and sort by season number
        const validSeasons = (details.seasons || [])
          .filter((s: { season_number: number }) => s.season_number > 0)
          .sort((a: { season_number: number }, b: { season_number: number }) => a.season_number - b.season_number);
        
        setSelectedShow({ ...details, seasons: validSeasons });
        
        // Auto-populate genre from TMDB
        if (details.genres && details.genres.length > 0) {
          setGenre(details.genres.map((g: { name: string }) => g.name).join(", "));
        }
      }
    } catch (error) {
      toast({ title: "Failed to fetch show details", variant: "destructive" });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSeasonSelect = async (seasonNumber: string) => {
    const seasonNum = parseInt(seasonNumber);
    setSelectedSeasonNumber(seasonNum);
    setLoadingEpisodes(true);
    setEpisodes([]);
    
    try {
      if (selectedShow) {
        const seasonData = await getSeasonEpisodes(selectedShow.id, seasonNum);
        if (seasonData && seasonData.episodes) {
          // Map TMDB episodes and add empty streamUrl
          const episodesWithUrls: EpisodeWithUrl[] = seasonData.episodes.map(ep => ({
            ...ep,
            streamUrl: ""
          }));
          setEpisodes(episodesWithUrls);
        }
      }
    } catch (error) {
      toast({ title: "Failed to fetch episodes", variant: "destructive" });
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const updateEpisodeUrl = (episodeNumber: number, url: string) => {
    setEpisodes(prev => 
      prev.map(ep => 
        ep.episode_number === episodeNumber 
          ? { ...ep, streamUrl: url }
          : ep
      )
    );
  };

  const validateUrls = () => {
    return episodes.every(ep => ep.streamUrl.trim() !== "" || ep.saved);
  };

  // Save a single episode
  const handleSaveEpisode = async (episode: EpisodeWithUrl) => {
    if (!selectedShow || selectedSeasonNumber === null) return;
    if (!episode.streamUrl.trim()) {
      toast({ title: "Please enter a streaming URL first", variant: "destructive" });
      return;
    }

    setSavingEpisode(episode.episode_number);
    try {
      // Check if series already exists in Firebase
      const moviesRef = ref(database, "movies");
      const snapshot = await get(moviesRef);
      let seriesKey: string | null = null;
      
      if (snapshot.exists()) {
        const movies = snapshot.val();
        for (const [key, movie] of Object.entries(movies as Record<string, any>)) {
          if (movie.tmdbId === selectedShow.id && movie.isSeries) {
            seriesKey = key;
            break;
          }
        }
      }

      const seasonKey = `season_${selectedSeasonNumber}`;
      const epKey = `episode_${episode.episode_number}`;
      const episodeData = {
        title: episode.name,
        streamUrl: episode.streamUrl,
        backdrop: getImageUrl(episode.still_path, "w780"),
        overview: episode.overview
      };

      if (seriesKey) {
        // Update existing series with new episode
        const episodeRef = ref(database, `movies/${seriesKey}/episodes/${seasonKey}/${epKey}`);
        await set(episodeRef, episodeData);
      } else {
        // Create new series with this episode
        const newSeriesRef = push(moviesRef);
        seriesKey = newSeriesRef.key;
        
        await set(newSeriesRef, {
          title: selectedShow.name,
          description: selectedShow.overview,
          year: selectedShow.first_air_date?.substring(0, 4) || "",
          genre,
          rating: "★★★★☆",
          vj,
          poster: getImageUrl(selectedShow.poster_path, "w500"),
          backdrop: getImageUrl(selectedShow.backdrop_path, "w1280"),
          section,
          featured,
          trending,
          isSeries: true,
          tmdbId: selectedShow.id,
          episodes: {
            [seasonKey]: {
              [epKey]: episodeData
            }
          },
          views: 0,
          uploadDate: Date.now(),
          timestamp: Date.now(),
        });
      }

      // Mark episode as saved
      setEpisodes(prev => 
        prev.map(ep => 
          ep.episode_number === episode.episode_number 
            ? { ...ep, saved: true }
            : ep
        )
      );

      toast({ title: `Episode ${episode.episode_number} saved!` });
    } catch (error) {
      toast({ title: "Failed to save episode", variant: "destructive" });
    } finally {
      setSavingEpisode(null);
    }
  };

  // Save series without links (for updating later)
  const handleSaveWithoutLinks = async () => {
    if (!selectedShow || selectedSeasonNumber === null) return;

    setSavingWithoutLinks(true);
    try {
      const moviesRef = ref(database, "movies");
      
      // Check if series already exists
      const snapshot = await get(moviesRef);
      let seriesExists = false;
      
      if (snapshot.exists()) {
        const movies = snapshot.val();
        for (const movie of Object.values(movies as Record<string, any>)) {
          if (movie.tmdbId === selectedShow.id && movie.isSeries) {
            seriesExists = true;
            break;
          }
        }
      }

      if (seriesExists) {
        toast({ title: "Series already exists! Add episodes individually.", variant: "destructive" });
        setSavingWithoutLinks(false);
        return;
      }

      const newSeriesRef = push(moviesRef);
      const seasonKey = `season_${selectedSeasonNumber}`;
      
      // Create episodes structure with empty URLs
      const episodesData: { [ep: string]: { title: string; streamUrl: string; backdrop: string; overview: string } } = {};
      episodes.forEach(ep => {
        const epKey = `episode_${ep.episode_number}`;
        episodesData[epKey] = {
          title: ep.name,
          streamUrl: ep.streamUrl || "", // Empty or existing URL
          backdrop: getImageUrl(ep.still_path, "w780"),
          overview: ep.overview
        };
      });

      await set(newSeriesRef, {
        title: selectedShow.name,
        description: selectedShow.overview,
        year: selectedShow.first_air_date?.substring(0, 4) || "",
        genre,
        rating: "★★★★☆",
        vj,
        poster: getImageUrl(selectedShow.poster_path, "w500"),
        backdrop: getImageUrl(selectedShow.backdrop_path, "w1280"),
        section,
        featured,
        trending,
        isSeries: true,
        tmdbId: selectedShow.id,
        episodes: { [seasonKey]: episodesData },
        views: 0,
        uploadDate: Date.now(),
        timestamp: Date.now(),
        incomplete: true, // Flag to indicate links need to be added
      });

      toast({ title: `Season ${selectedSeasonNumber} saved! You can add links later in Manage Series.` });
      
      // Reset form
      setSelectedShow(null);
      setSelectedSeasonNumber(null);
      setEpisodes([]);
      setVj("");
      setGenre("");
      setSection("popular");
      setFeatured(false);
      setTrending(false);
    } catch (error) {
      toast({ title: "Failed to save series", variant: "destructive" });
    } finally {
      setSavingWithoutLinks(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedShow) {
      toast({ title: "Please select a series", variant: "destructive" });
      return;
    }
    
    if (selectedSeasonNumber === null) {
      toast({ title: "Please select a season", variant: "destructive" });
      return;
    }
    
    if (episodes.length === 0) {
      toast({ title: "No episodes found for this season", variant: "destructive" });
      return;
    }
    
    if (!validateUrls()) {
      toast({ title: "All streaming URLs are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const moviesRef = ref(database, "movies");
      const newSeriesRef = push(moviesRef);
      
      // Build episodes data structure
      const seasonKey = `season_${selectedSeasonNumber}`;
      const episodesData: { [season: string]: { [ep: string]: { title: string; streamUrl: string; backdrop: string; overview: string } } } = {
        [seasonKey]: {}
      };
      
      episodes.forEach(ep => {
        const epKey = `episode_${ep.episode_number}`;
        episodesData[seasonKey][epKey] = {
          title: ep.name,
          streamUrl: ep.streamUrl,
          backdrop: getImageUrl(ep.still_path, "w780"),
          overview: ep.overview
        };
      });

      await set(newSeriesRef, {
        title: selectedShow.name,
        description: selectedShow.overview,
        year: selectedShow.first_air_date?.substring(0, 4) || "",
        genre,
        rating: "★★★★☆",
        vj,
        poster: getImageUrl(selectedShow.poster_path, "w500"),
        backdrop: getImageUrl(selectedShow.backdrop_path, "w1280"),
        section,
        featured,
        trending,
        isSeries: true,
        tmdbId: selectedShow.id,
        episodes: episodesData,
        views: 0,
        uploadDate: Date.now(),
        timestamp: Date.now(),
      });

      const seriesId = newSeriesRef.key;

      // Add notification to Firebase for in-app notifications
      const notificationsRef = ref(database, "notifications");
      await push(notificationsRef, {
        title: `📺 New: ${selectedShow.name}`,
        message: `${selectedShow.name} Season ${selectedSeasonNumber} is now available on UgaWatch!`,
        type: "new_series",
        poster: getImageUrl(selectedShow.poster_path, "w500") || null,
        movieId: seriesId,
        timestamp: Date.now(),
        read: false,
      });

      // Send push notifications to all registered devices
      await sendPushToAllUsers(
        `📺 New Series: ${selectedShow.name}`,
        `${selectedShow.name} Season ${selectedSeasonNumber} is now streaming!`,
        getImageUrl(selectedShow.poster_path, "w500"),
        seriesId || undefined
      );

      toast({ title: `Season ${selectedSeasonNumber} added & users notified!` });
      
      // Reset form
      setSelectedShow(null);
      setSelectedSeasonNumber(null);
      setEpisodes([]);
      setVj("");
      setGenre("");
      setSection("popular");
      setFeatured(false);
      setTrending(false);
    } catch (error) {
      toast({ title: "Failed to add series", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const resetSelection = () => {
    setSelectedShow(null);
    setSelectedSeasonNumber(null);
    setEpisodes([]);
    setSearchResults([]);
    setSearchQuery("");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <Tv className="w-6 h-6 text-primary" />
        Add New Series
      </h1>

      {/* Step 1: TMDB Search */}
      {!selectedShow && (
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Step 1: Search TMDB for Series
          </h3>
          
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search TV shows..."
                className="w-full pl-10 pr-4 py-3 bg-muted rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching} size="lg">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          {loadingDetails && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading show details...</span>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectShow(item)}
                  className="text-left bg-muted rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all group"
                >
                  <div className="relative">
                    <img
                      src={getImageUrl(item.poster_path)}
                      alt={item.name || item.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Check className="w-8 h-8 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.name || item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(item.first_air_date || item.release_date || "").substring(0, 4)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Season Selection */}
      {selectedShow && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selected Show Info */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-start gap-4">
              <img
                src={getImageUrl(selectedShow.poster_path)}
                alt={selectedShow.name}
                className="w-24 h-36 object-cover rounded-lg"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-foreground">{selectedShow.name}</h2>
                  <Button type="button" variant="ghost" size="sm" onClick={resetSelection}>
                    Change Series
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedShow.first_air_date?.substring(0, 4)} • {selectedShow.seasons.length} Season(s)
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">{selectedShow.overview}</p>
              </div>
            </div>
          </div>

          {/* Season Selector */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              Step 2: Select Season to Upload
            </h3>
            
            <Select 
              value={selectedSeasonNumber?.toString() || ""} 
              onValueChange={handleSeasonSelect}
            >
              <SelectTrigger className="w-full md:w-80 bg-muted">
                <SelectValue placeholder="Choose a season..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {selectedShow.seasons.map((season) => (
                  <SelectItem 
                    key={season.season_number} 
                    value={season.season_number.toString()}
                    className="text-foreground"
                  >
                    Season {season.season_number} ({season.episode_count} episodes)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Settings */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Additional Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">VJ</label>
                <input
                  type="text"
                  value={vj}
                  onChange={(e) => setVj(e.target.value)}
                  placeholder="VJ Junior, VJ Emmy..."
                  className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Genre</label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Auto-filled from TMDB"
                  className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="popular">Popular</option>
                  <option value="trending">Trending</option>
                  <option value="new">New Releases</option>
                  <option value="featured">Featured</option>
                </select>
              </div>
            </div>
            <div className="flex gap-6 mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-foreground">Featured</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={trending}
                  onChange={(e) => setTrending(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-foreground">Trending</span>
              </label>
            </div>
          </div>

          {/* Episodes Grid */}
          {loadingEpisodes && (
            <div className="bg-card rounded-xl p-12 border border-border flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading episodes...</span>
            </div>
          )}

          {selectedSeasonNumber !== null && episodes.length > 0 && (
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Step 3: Add Streaming URLs for Season {selectedSeasonNumber}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Episode data is auto-filled from TMDB. Only streaming URLs require manual entry.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {episodes.map((episode) => (
                  <div 
                    key={episode.episode_number} 
                    className={`bg-muted/50 rounded-lg overflow-hidden border ${episode.saved ? 'border-primary' : 'border-border'}`}
                  >
                    {/* Episode Thumbnail */}
                    <div className="relative aspect-video">
                      <img
                        src={getImageUrl(episode.still_path, "w500")}
                        alt={episode.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-foreground">
                        Episode {episode.episode_number}
                      </div>
                      {episode.saved && (
                        <div className="absolute top-2 right-2 bg-primary px-2 py-1 rounded text-xs font-bold text-primary-foreground flex items-center gap-1">
                          <Check className="w-3 h-3" /> Saved
                        </div>
                      )}
                    </div>
                    
                    {/* Episode Info */}
                    <div className="p-4">
                      <h4 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">
                        Episode {episode.episode_number}: {episode.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {episode.overview || "No description available"}
                      </p>
                      
                      {/* Stream URL Input */}
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-primary">
                          Streaming URL for Episode {episode.episode_number}
                        </label>
                        <input
                          type="url"
                          value={episode.streamUrl}
                          onChange={(e) => updateEpisodeUrl(episode.episode_number, e.target.value)}
                          placeholder="https://..."
                          disabled={episode.saved}
                          className={`w-full px-3 py-2 bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-border ${episode.saved ? 'opacity-50' : ''}`}
                        />
                        
                        {/* Save Episode Button */}
                        {!episode.saved && episode.streamUrl.trim() && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSaveEpisode(episode)}
                            disabled={savingEpisode === episode.episode_number}
                            className="w-full"
                          >
                            {savingEpisode === episode.episode_number ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <Save className="w-3 h-3 mr-1" />
                            )}
                            Save Episode {episode.episode_number}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          {selectedSeasonNumber !== null && episodes.length > 0 && (
            <div className="space-y-3">
              {/* Save Without Links Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="lg"
                onClick={handleSaveWithoutLinks}
                disabled={savingWithoutLinks || saving}
              >
                {savingWithoutLinks ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                {savingWithoutLinks ? "Saving..." : "Save Without Links (Update Later)"}
              </Button>
              
              {/* Upload All Button */}
              <Button type="submit" className="w-full" size="lg" disabled={saving || savingWithoutLinks}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {saving ? "Saving..." : `Upload All Episodes with Links (${episodes.filter(e => e.streamUrl.trim()).length}/${episodes.length})`}
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default AdminAddSeries;
