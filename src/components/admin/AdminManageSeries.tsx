import { useState, useMemo } from "react";
import { Tv, Search, Edit2, Trash2, Loader2, ChevronDown, ChevronUp, Play, Info, Film, Check, AlertTriangle, Link } from "lucide-react";
import { ref, remove, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { useMovies, Movie } from "@/hooks/useMovies";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  searchTVShows, 
  getTVShowDetails, 
  getSeasonEpisodes, 
  getImageUrl, 
  TMDBMovie, 
  TMDBTVShowDetails, 
  TMDBEpisode 
} from "@/lib/tmdb";

interface Episode {
  title: string;
  streamUrl: string;
  backdrop: string;
  overview?: string;
}

interface EpisodeWithUrl extends TMDBEpisode {
  streamUrl: string;
}

const AdminManageSeries = () => {
  const { movies } = useMovies();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterIncomplete, setFilterIncomplete] = useState(false);
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  
  // Edit modal state
  const [editingSeries, setEditingSeries] = useState<Movie | null>(null);
  const [editMode, setEditMode] = useState<"tmdb" | "manual">("tmdb");
  
  // TMDB search state for editing
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState("");
  const [tmdbSearchResults, setTmdbSearchResults] = useState<TMDBMovie[]>([]);
  const [searchingTmdb, setSearchingTmdb] = useState(false);
  const [selectedShow, setSelectedShow] = useState<TMDBTVShowDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [tmdbEpisodes, setTmdbEpisodes] = useState<EpisodeWithUrl[]>([]);
  
  // Manual edit state (fallback)
  const [editingEpisodes, setEditingEpisodes] = useState<{ [season: string]: { [ep: string]: Episode } }>({});
  
  const [saving, setSaving] = useState(false);

  const series = useMemo(() => 
    movies.filter(m => m.isSeries).sort((a, b) => b.uploadDate - a.uploadDate),
    [movies]
  );

  // Check if a series has missing episode links
  const hasIncompleteEpisodes = (seriesItem: Movie): boolean => {
    if (!seriesItem.episodes) return true;
    if ((seriesItem as any).incomplete) return true;
    
    for (const season of Object.values(seriesItem.episodes)) {
      for (const episode of Object.values(season)) {
        if (!episode.streamUrl || episode.streamUrl.trim() === "") {
          return true;
        }
      }
    }
    return false;
  };

  // Count missing links in a series
  const getMissingLinksCount = (seriesItem: Movie): number => {
    if (!seriesItem.episodes) return 0;
    let count = 0;
    
    for (const season of Object.values(seriesItem.episodes)) {
      for (const episode of Object.values(season)) {
        if (!episode.streamUrl || episode.streamUrl.trim() === "") {
          count++;
        }
      }
    }
    return count;
  };

  const incompleteSeries = useMemo(() => 
    series.filter(s => hasIncompleteEpisodes(s)),
    [series]
  );

  const filteredSeries = series.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterIncomplete || hasIncompleteEpisodes(s);
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (seriesId: string) => {
    if (!confirm("Delete this series and all its episodes?")) return;
    
    try {
      await remove(ref(database, `movies/${seriesId}`));
      toast({ title: "Series deleted" });
    } catch {
      toast({ title: "Failed to delete series", variant: "destructive" });
    }
  };

  const startEditing = (seriesItem: Movie) => {
    setEditingSeries(seriesItem);
    setEditingEpisodes(seriesItem.episodes || {});
    setEditMode("tmdb");
    setTmdbSearchQuery("");
    setTmdbSearchResults([]);
    setSelectedShow(null);
    setSelectedSeasonNumber(null);
    setTmdbEpisodes([]);
  };

  const closeEditModal = () => {
    setEditingSeries(null);
    setEditMode("tmdb");
    setTmdbSearchQuery("");
    setTmdbSearchResults([]);
    setSelectedShow(null);
    setSelectedSeasonNumber(null);
    setTmdbEpisodes([]);
    setEditingEpisodes({});
  };

  // TMDB Search handlers
  const handleTmdbSearch = async () => {
    if (!tmdbSearchQuery.trim()) return;
    
    setSearchingTmdb(true);
    try {
      const results = await searchTVShows(tmdbSearchQuery);
      setTmdbSearchResults(results.slice(0, 8));
    } catch {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setSearchingTmdb(false);
    }
  };

  const handleSelectShow = async (item: TMDBMovie) => {
    setLoadingDetails(true);
    setTmdbSearchResults([]);
    setTmdbSearchQuery("");
    
    try {
      const details = await getTVShowDetails(item.id);
      if (details) {
        const validSeasons = (details.seasons || [])
          .filter((s: { season_number: number }) => s.season_number > 0)
          .sort((a: { season_number: number }, b: { season_number: number }) => a.season_number - b.season_number);
        
        setSelectedShow({ ...details, seasons: validSeasons });
      }
    } catch {
      toast({ title: "Failed to fetch show details", variant: "destructive" });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSeasonSelect = async (seasonNumber: string) => {
    const seasonNum = parseInt(seasonNumber);
    setSelectedSeasonNumber(seasonNum);
    setLoadingEpisodes(true);
    setTmdbEpisodes([]);
    
    try {
      if (selectedShow) {
        const seasonData = await getSeasonEpisodes(selectedShow.id, seasonNum);
        if (seasonData && seasonData.episodes) {
          // Check if we have existing URLs for this season
          const existingSeasonKey = `season_${seasonNum}`;
          const existingEpisodes = editingSeries?.episodes?.[existingSeasonKey] || {};
          
          const episodesWithUrls: EpisodeWithUrl[] = seasonData.episodes.map(ep => {
            const existingEpKey = `episode_${ep.episode_number}`;
            const existingUrl = existingEpisodes[existingEpKey]?.streamUrl || "";
            return {
              ...ep,
              streamUrl: existingUrl
            };
          });
          setTmdbEpisodes(episodesWithUrls);
        }
      }
    } catch {
      toast({ title: "Failed to fetch episodes", variant: "destructive" });
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const updateTmdbEpisodeUrl = (episodeNumber: number, url: string) => {
    setTmdbEpisodes(prev => 
      prev.map(ep => 
        ep.episode_number === episodeNumber 
          ? { ...ep, streamUrl: url }
          : ep
      )
    );
  };

  const handleSaveTmdbSeason = async () => {
    if (!editingSeries || selectedSeasonNumber === null || tmdbEpisodes.length === 0) return;
    
    const hasEmptyUrls = tmdbEpisodes.some(ep => !ep.streamUrl.trim());
    if (hasEmptyUrls) {
      toast({ title: "All streaming URLs are required", variant: "destructive" });
      return;
    }
    
    setSaving(true);
    try {
      const seasonKey = `season_${selectedSeasonNumber}`;
      const existingEpisodes = editingSeries.episodes || {};
      
      const newSeasonEpisodes: { [ep: string]: Episode } = {};
      tmdbEpisodes.forEach(ep => {
        const epKey = `episode_${ep.episode_number}`;
        newSeasonEpisodes[epKey] = {
          title: ep.name,
          streamUrl: ep.streamUrl,
          backdrop: getImageUrl(ep.still_path, "w780"),
          overview: ep.overview
        };
      });

      await update(ref(database, `movies/${editingSeries.id}`), {
        episodes: {
          ...existingEpisodes,
          [seasonKey]: newSeasonEpisodes
        }
      });
      
      toast({ title: `Season ${selectedSeasonNumber} updated successfully!` });
      closeEditModal();
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Manual edit handlers (fallback mode)
  const updateEpisode = (seasonKey: string, epKey: string, field: keyof Episode, value: string) => {
    setEditingEpisodes({
      ...editingEpisodes,
      [seasonKey]: {
        ...editingEpisodes[seasonKey],
        [epKey]: {
          ...editingEpisodes[seasonKey][epKey],
          [field]: value
        }
      }
    });
  };

  const handleSaveManual = async () => {
    if (!editingSeries) return;
    
    setSaving(true);
    try {
      await update(ref(database, `movies/${editingSeries.id}`), {
        episodes: editingEpisodes
      });
      toast({ title: "Episodes updated" });
      closeEditModal();
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getEpisodeCount = (seriesItem: Movie) => {
    if (!seriesItem.episodes) return 0;
    return Object.values(seriesItem.episodes).reduce(
      (total, season) => total + Object.keys(season).length, 
      0
    );
  };

  const getSeasonCount = (seriesItem: Movie) => {
    return seriesItem.episodes ? Object.keys(seriesItem.episodes).length : 0;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <Tv className="w-6 h-6 text-primary" />
        Manage Series
      </h1>

      {/* Incomplete Series Alert */}
      {incompleteSeries.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-amber-500">
              {incompleteSeries.length} Series with Missing Links
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            These series have episodes without streaming URLs. Click on a series to add the missing links.
          </p>
          <Button
            variant={filterIncomplete ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterIncomplete(!filterIncomplete)}
            className="gap-2"
          >
            <Link className="w-4 h-4" />
            {filterIncomplete ? "Show All Series" : "Show Only Incomplete"}
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search series..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-2xl font-bold text-foreground">{series.length}</p>
          <p className="text-sm text-muted-foreground">Total Series</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-2xl font-bold text-foreground">
            {series.reduce((total, s) => total + getEpisodeCount(s), 0)}
          </p>
          <p className="text-sm text-muted-foreground">Total Episodes</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-amber-500/30">
          <p className="text-2xl font-bold text-amber-500">{incompleteSeries.length}</p>
          <p className="text-sm text-muted-foreground">Incomplete</p>
        </div>
      </div>

      {/* Series List */}
      <div className="space-y-3">
        {filteredSeries.map(seriesItem => {
          const isIncomplete = hasIncompleteEpisodes(seriesItem);
          const missingCount = getMissingLinksCount(seriesItem);
          
          return (
          <div key={seriesItem.id} className={`bg-card rounded-xl border overflow-hidden ${isIncomplete ? 'border-amber-500/50' : 'border-border'}`}>
            {/* Header */}
            <div 
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedSeries(expandedSeries === seriesItem.id ? null : seriesItem.id)}
            >
              <div className="relative">
                <img 
                  src={seriesItem.poster} 
                  alt={seriesItem.title} 
                  className="w-12 h-16 object-cover rounded"
                />
                {isIncomplete && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5">
                    <AlertTriangle className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{seriesItem.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {getSeasonCount(seriesItem)} seasons • {getEpisodeCount(seriesItem)} episodes
                </p>
                {isIncomplete && missingCount > 0 && (
                  <p className="text-xs text-amber-500 mt-1">
                    ⚠️ {missingCount} episode{missingCount !== 1 ? 's' : ''} missing links
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); startEditing(seriesItem); }}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(seriesItem.id); }}
                  className="p-2 rounded-lg hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
                {expandedSeries === seriesItem.id ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Expanded Episodes View */}
            {expandedSeries === seriesItem.id && seriesItem.episodes && (
              <div className="border-t border-border p-3 bg-muted/30">
                {Object.entries(seriesItem.episodes).map(([seasonKey, episodes]) => (
                  <div key={seasonKey} className="mb-3 last:mb-0">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                      {seasonKey.replace("_", " ")}
                    </h4>
                    <div className="grid gap-2">
                      {Object.entries(episodes).map(([epKey, episode]) => (
                        <div 
                          key={epKey}
                          className="flex items-center gap-3 p-2 bg-card rounded-lg border border-border"
                        >
                          <div className="w-20 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                            {episode.backdrop ? (
                              <img src={episode.backdrop} alt={episode.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {episode.title || epKey.replace("_", " ")}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {episode.streamUrl || "No stream URL"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {!seriesItem.episodes && (
                  <p className="text-center text-muted-foreground py-4">No episodes added</p>
                )}
              </div>
            )}
          </div>
          );
        })}

        {filteredSeries.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery ? "No series match your search" : "No series found"}
          </div>
        )}
      </div>

      {/* Edit Episodes Dialog - TMDB Integrated */}
      <Dialog open={!!editingSeries} onOpenChange={() => closeEditModal()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-primary" />
              Edit Episodes - {editingSeries?.title}
            </DialogTitle>
          </DialogHeader>
          
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={editMode === "tmdb" ? "default" : "outline"}
              size="sm"
              onClick={() => setEditMode("tmdb")}
            >
              <Film className="w-4 h-4 mr-1" />
              TMDB Mode
            </Button>
            <Button
              variant={editMode === "manual" ? "default" : "outline"}
              size="sm"
              onClick={() => setEditMode("manual")}
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Manual Mode
            </Button>
          </div>

          {editMode === "tmdb" ? (
            <div className="space-y-4">
              {/* TMDB Search */}
              {!selectedShow && (
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Search className="w-4 h-4 text-primary" />
                    Search TMDB for Updated Episodes
                  </h3>
                  
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={tmdbSearchQuery}
                        onChange={(e) => setTmdbSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleTmdbSearch()}
                        placeholder={`Search "${editingSeries?.title}" or another show...`}
                        className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    <Button onClick={handleTmdbSearch} disabled={searchingTmdb} size="sm">
                      {searchingTmdb ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                    </Button>
                  </div>

                  {loadingDetails && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading show details...</span>
                    </div>
                  )}

                  {tmdbSearchResults.length > 0 && (
                    <div className="grid grid-cols-4 gap-3">
                      {tmdbSearchResults.map((item) => (
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
                              <Check className="w-6 h-6 text-primary-foreground" />
                            </div>
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium text-foreground truncate">
                              {item.name || item.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(item.first_air_date || "").substring(0, 4)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Selected Show + Season Selector */}
              {selectedShow && (
                <>
                  <div className="bg-muted/30 rounded-xl p-4 border border-border">
                    <div className="flex items-start gap-3">
                      <img
                        src={getImageUrl(selectedShow.poster_path)}
                        alt={selectedShow.name}
                        className="w-16 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-foreground">{selectedShow.name}</h3>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setSelectedShow(null); setSelectedSeasonNumber(null); setTmdbEpisodes([]); }}
                          >
                            Change
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {selectedShow.first_air_date?.substring(0, 4)} • {selectedShow.seasons.length} Season(s)
                        </p>
                        
                        <Select 
                          value={selectedSeasonNumber?.toString() || ""} 
                          onValueChange={handleSeasonSelect}
                        >
                          <SelectTrigger className="w-full bg-muted">
                            <SelectValue placeholder="Select a season to edit..." />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border z-[100]">
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
                    </div>
                  </div>

                  {/* Loading Episodes */}
                  {loadingEpisodes && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading episodes...</span>
                    </div>
                  )}

                  {/* Episodes Grid */}
                  {selectedSeasonNumber !== null && tmdbEpisodes.length > 0 && (
                    <div className="bg-muted/30 rounded-xl p-4 border border-border">
                      <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        Season {selectedSeasonNumber} Episodes
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        Episode data auto-filled from TMDB. Only add/update streaming URLs.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-2">
                        {tmdbEpisodes.map((episode) => (
                          <div 
                            key={episode.episode_number} 
                            className="bg-card rounded-lg overflow-hidden border border-border"
                          >
                            <div className="flex gap-3 p-3">
                              <div className="w-24 h-14 rounded overflow-hidden flex-shrink-0">
                                <img
                                  src={getImageUrl(episode.still_path, "w500")}
                                  alt={episode.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground line-clamp-1 mb-1">
                                  Ep {episode.episode_number}: {episode.name}
                                </p>
                                <input
                                  type="url"
                                  placeholder="Stream URL *"
                                  value={episode.streamUrl}
                                  onChange={(e) => updateTmdbEpisodeUrl(episode.episode_number, e.target.value)}
                                  className="w-full px-2 py-1.5 bg-muted rounded text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" onClick={closeEditModal} className="flex-1">
                          Cancel
                        </Button>
                        <Button onClick={handleSaveTmdbSeason} className="flex-1" disabled={saving}>
                          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Save Season {selectedSeasonNumber}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Manual Edit Mode (Fallback) */
            <div className="space-y-4">
              {Object.entries(editingEpisodes).map(([seasonKey, episodes]) => (
                <div key={seasonKey} className="border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-muted/50">
                    <span className="font-medium text-foreground capitalize">
                      {seasonKey.replace("_", " ")}
                    </span>
                  </div>
                  
                  <div className="p-3 space-y-3">
                    {Object.entries(episodes).map(([epKey, episode]) => (
                      <div key={epKey} className="bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground capitalize">
                            {epKey.replace("_", " ")}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <input
                            type="text"
                            placeholder="Episode Title"
                            value={episode.title}
                            onChange={(e) => updateEpisode(seasonKey, epKey, "title", e.target.value)}
                            className="px-3 py-2 bg-muted rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            type="url"
                            placeholder="Stream URL"
                            value={episode.streamUrl}
                            onChange={(e) => updateEpisode(seasonKey, epKey, "streamUrl", e.target.value)}
                            className="px-3 py-2 bg-muted rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <Button variant="outline" onClick={closeEditModal} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveManual} className="flex-1" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManageSeries;
