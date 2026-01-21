import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { ref, push, set, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { searchMovies, searchTVShows, getMovieDetails, getTVShowDetails, getImageUrl, TMDBMovie } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminAddMovieProps {
  isSeries: boolean;
}

const AdminAddMovie = ({ isSeries }: AdminAddMovieProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    year: "",
    genre: "",
    rating: "★★★★☆",
    vj: "",
    poster: "",
    backdrop: "",
    streamUrl: "",
    section: "popular",
    featured: false,
    trending: false,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const results = isSeries 
        ? await searchTVShows(searchQuery)
        : await searchMovies(searchQuery);
      setSearchResults(results.slice(0, 10));
    } catch (error) {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const selectFromTMDB = async (item: TMDBMovie) => {
    setLoadingDetails(true);
    setSearchResults([]);
    setSearchQuery("");
    
    try {
      // Fetch full details to get genres
      const details = isSeries 
        ? await getTVShowDetails(item.id)
        : await getMovieDetails(item.id);
      
      let genreString = "";
      if (details?.genres && details.genres.length > 0) {
        genreString = details.genres.map((g: { name: string }) => g.name).join(", ");
      }

      setFormData({
        ...formData,
        title: item.title || item.name || "",
        description: item.overview,
        year: (item.release_date || item.first_air_date || "").substring(0, 4),
        genre: genreString,
        poster: getImageUrl(item.poster_path, "w500"),
        backdrop: getImageUrl(item.backdrop_path, "w1280"),
      });
    } catch (error) {
      // Fallback without genres
      setFormData({
        ...formData,
        title: item.title || item.name || "",
        description: item.overview,
        year: (item.release_date || item.first_air_date || "").substring(0, 4),
        poster: getImageUrl(item.poster_path, "w500"),
        backdrop: getImageUrl(item.backdrop_path, "w1280"),
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Send push notifications to all users
  const sendPushToAllUsers = async (title: string, body: string, imageUrl?: string, movieId?: string) => {
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

      console.log(`Sending push to ${tokens.length} devices for new content`);

      // Call edge function
      const { data, error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          tokens,
          title,
          body,
          image: imageUrl || undefined,
          data: {
            movieId: movieId || "",
            link: movieId ? `/movie/${movieId}` : "/",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const moviesRef = ref(database, "movies");
      const newMovieRef = push(moviesRef);
      const movieId = newMovieRef.key;
      
      await set(newMovieRef, {
        ...formData,
        isSeries,
        views: 0,
        uploadDate: Date.now(),
        timestamp: Date.now(),
      });

      // Auto-send notification for new upload
      const notificationsRef = ref(database, "notifications");
      await push(notificationsRef, {
        title: `🎬 New: ${formData.title}`,
        message: `${formData.title} is now available on UgaWatch. Watch it now!`,
        type: isSeries ? "new_series" : "new_movie",
        poster: formData.poster || null,
        movieId: movieId,
        redirectLink: `/movie/${movieId}`,
        timestamp: Date.now(),
        read: false,
      });

      // Send push notifications to all registered devices
      await sendPushToAllUsers(
        `🎬 New: ${formData.title}`,
        `${formData.title} is now available on UgaWatch!`,
        formData.poster,
        movieId || undefined
      );

      toast({ title: `${isSeries ? "Series" : "Movie"} added & notified users!` });
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        year: "",
        genre: "",
        rating: "★★★★☆",
        vj: "",
        poster: "",
        backdrop: "",
        streamUrl: "",
        section: "popular",
        featured: false,
        trending: false,
      });
    } catch (error) {
      toast({ title: "Failed to add content", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">
        Add New {isSeries ? "Series" : "Movie"}
      </h1>

      {/* TMDB Search */}
      <div className="bg-card rounded-xl p-4 mb-6 border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Search TMDB</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={`Search ${isSeries ? "TV shows" : "movies"}...`}
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {searchResults.map((item) => (
              <button
                key={item.id}
                onClick={() => selectFromTMDB(item)}
                className="text-left bg-muted rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
              >
                <img
                  src={getImageUrl(item.poster_path)}
                  alt={item.title || item.name}
                  className="w-full aspect-[2/3] object-cover"
                />
                <div className="p-2">
                  <p className="text-xs font-medium text-foreground truncate">
                    {item.title || item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(item.release_date || item.first_air_date || "").substring(0, 4)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-card rounded-xl p-4 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Year</label>
            <input
              type="text"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Genre</label>
            <input
              type="text"
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              placeholder="Action, Drama, Comedy..."
              className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">VJ</label>
            <input
              type="text"
              value={formData.vj}
              onChange={(e) => setFormData({ ...formData, vj: e.target.value })}
              placeholder="VJ Junior, VJ Emmy..."
              className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Poster URL</label>
            <input
              type="url"
              value={formData.poster}
              onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
              className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Backdrop URL</label>
            <input
              type="url"
              value={formData.backdrop}
              onChange={(e) => setFormData({ ...formData, backdrop: e.target.value })}
              className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Stream URL</label>
            <input
              type="url"
              value={formData.streamUrl}
              onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
              className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Section</label>
            <select
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="popular">Popular</option>
              <option value="trending">Trending</option>
              <option value="new">New Releases</option>
              <option value="featured">Featured</option>
              <option value="animations">Animations</option>
            </select>
          </div>

          <div className="md:col-span-2 flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-foreground">Featured</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.trending}
                onChange={(e) => setFormData({ ...formData, trending: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-foreground">Trending</span>
            </label>
          </div>
        </div>

        {/* Image Previews */}
        {(formData.poster || formData.backdrop) && (
          <div className="mt-4 flex gap-4">
            {formData.poster && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Poster Preview</p>
                <img src={formData.poster} alt="Poster" className="w-20 h-28 object-cover rounded" />
              </div>
            )}
            {formData.backdrop && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Backdrop Preview</p>
                <img src={formData.backdrop} alt="Backdrop" className="w-40 h-24 object-cover rounded" />
              </div>
            )}
          </div>
        )}

        <Button type="submit" className="mt-6 w-full" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {saving ? "Saving..." : `Add ${isSeries ? "Series" : "Movie"}`}
        </Button>
      </form>
    </div>
  );
};

export default AdminAddMovie;
