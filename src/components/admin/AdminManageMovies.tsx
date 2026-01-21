import { useState, useEffect, useMemo } from "react";
import { Search, Trash2, Edit, Eye, Loader2, X, Save } from "lucide-react";
import { ref, onValue, remove, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { Movie } from "@/hooks/useMovies";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const AdminManageMovies = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSection, setFilterSection] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    const moviesRef = ref(database, "movies");

    const unsubscribe = onValue(moviesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const moviesArray = Object.entries(data)
          .map(([id, movie]) => ({
            id,
            ...(movie as Omit<Movie, "id">),
          }))
          .sort((a, b) => b.uploadDate - a.uploadDate);
        setMovies(moviesArray);
      } else {
        setMovies([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isWasabiUrl = (url?: string) => {
    if (!url) return false;
    return /wasabisys\.com/i.test(url);
  };

  const movieUsesWasabi = (movie: Movie) => {
    if (isWasabiUrl(movie.streamUrl)) return true;

    if (movie.isSeries && movie.episodes) {
      return Object.values(movie.episodes).some((season) =>
        Object.values(season).some((ep) => isWasabiUrl(ep.streamUrl))
      );
    }

    return false;
  };

  const wasabiMovies = useMemo(
    () => movies.filter(movieUsesWasabi),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [movies]
  );

  const handleDelete = async (movieId: string) => {
    if (!confirm("Are you sure you want to delete this movie?")) return;

    setDeleting(movieId);
    try {
      await remove(ref(database, `movies/${movieId}`));
      toast({ title: "Movie deleted successfully" });
    } catch (error) {
      toast({ title: "Failed to delete movie", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteWasabi = async () => {
    if (wasabiMovies.length === 0) {
      toast({ title: "No Wasabi movies found" });
      return;
    }

    const confirmed = window.confirm(
      `⚠️ This will permanently delete ${wasabiMovies.length} movie(s)/series that use Wasabi stream links. Continue?`
    );
    if (!confirmed) return;

    const typed = window.prompt(
      `Type DELETE to confirm deleting ${wasabiMovies.length} item(s):`
    );
    if (typed !== "DELETE") {
      toast({ title: "Deletion cancelled" });
      return;
    }

    setBulkDeleting(true);
    try {
      await Promise.all(
        wasabiMovies.map((m) => remove(ref(database, `movies/${m.id}`)))
      );
      toast({
        title: "Deleted Wasabi movies",
        description: `${wasabiMovies.length} item(s) removed.`,
      });
    } catch (error) {
      toast({ title: "Failed to delete Wasabi movies", variant: "destructive" });
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleFeatured = async (movieId: string, currentValue: boolean) => {
    try {
      await update(ref(database, `movies/${movieId}`), { featured: !currentValue });
      toast({ title: `Movie ${!currentValue ? "featured" : "unfeatured"}` });
    } catch (error) {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const toggleTrending = async (movieId: string, currentValue: boolean) => {
    try {
      await update(ref(database, `movies/${movieId}`), { trending: !currentValue });
      toast({ title: `Movie ${!currentValue ? "added to" : "removed from"} trending` });
    } catch (error) {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleEditSave = async () => {
    if (!editingMovie) return;

    setSaving(true);
    try {
      const { id, ...movieData } = editingMovie;
      await update(ref(database, `movies/${id}`), movieData);
      toast({ title: "Movie updated successfully" });
      setEditingMovie(null);
    } catch (error) {
      toast({ title: "Failed to update movie", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateEditField = (field: keyof Movie, value: string | number | boolean) => {
    if (!editingMovie) return;
    setEditingMovie({ ...editingMovie, [field]: value });
  };

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch =
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.vj?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = filterSection === "all" || movie.section === filterSection;
    return matchesSearch && matchesSection;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Manage Movies</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or VJ..."
            className="w-full pl-10 pr-4 py-2 bg-card rounded-lg text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          className="px-4 py-2 bg-card rounded-lg text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Sections</option>
          <option value="popular">Popular</option>
          <option value="trending">Trending</option>
          <option value="new">New Releases</option>
          <option value="featured">Featured</option>
          <option value="animations">Animations</option>
        </select>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 shimmer rounded-xl" />
          ))}
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No movies found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMovies.map((movie) => (
            <div key={movie.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex">
                <img
                  src={movie.poster || "/placeholder.svg"}
                  alt={movie.title}
                  className="w-20 h-28 object-cover flex-shrink-0"
                />
                <div className="flex-1 p-3 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{movie.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {movie.year} {movie.genre && `• ${movie.genre}`}
                  </p>
                  {movie.vj && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-secondary/20 text-secondary text-xs rounded">
                      {movie.vj}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Eye className="w-3 h-3" />
                    <span>{movie.views || 0} views</span>
                    {movie.isSeries && (
                      <span className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-[10px]">
                        SERIES
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between p-2 border-t border-border bg-muted/30">
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleFeatured(movie.id, movie.featured)}
                    className={`px-2 py-1 text-xs rounded ${movie.featured ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    Featured
                  </button>
                  <button
                    onClick={() => toggleTrending(movie.id, movie.trending)}
                    className={`px-2 py-1 text-xs rounded ${movie.trending ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    Trending
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingMovie(movie)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(movie.id)}
                    disabled={deleting === movie.id}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    {deleting === movie.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground mt-4">
        Showing {filteredMovies.length} of {movies.length} movies
      </p>

      {/* Edit Movie Dialog */}
      <Dialog open={!!editingMovie} onOpenChange={(open) => !open && setEditingMovie(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Movie</DialogTitle>
          </DialogHeader>
          
          {editingMovie && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={editingMovie.title}
                    onChange={(e) => updateEditField("title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={editingMovie.year || ""}
                    onChange={(e) => updateEditField("year", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingMovie.description || ""}
                  onChange={(e) => updateEditField("description", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    value={editingMovie.genre || ""}
                    onChange={(e) => updateEditField("genre", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating</Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={editingMovie.rating || ""}
                    onChange={(e) => updateEditField("rating", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="poster">Poster URL</Label>
                <Input
                  id="poster"
                  value={editingMovie.poster || ""}
                  onChange={(e) => updateEditField("poster", e.target.value)}
                />
                {editingMovie.poster && (
                  <img src={editingMovie.poster} alt="Poster preview" className="w-20 h-28 object-cover rounded mt-2" />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="backdrop">Backdrop URL</Label>
                <Input
                  id="backdrop"
                  value={editingMovie.backdrop || ""}
                  onChange={(e) => updateEditField("backdrop", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="streamUrl">Stream URL</Label>
                <Input
                  id="streamUrl"
                  value={editingMovie.streamUrl || ""}
                  onChange={(e) => updateEditField("streamUrl", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vj">VJ Name</Label>
                  <Input
                    id="vj"
                    value={editingMovie.vj || ""}
                    onChange={(e) => updateEditField("vj", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <select
                    id="section"
                    value={editingMovie.section || ""}
                    onChange={(e) => updateEditField("section", e.target.value)}
                    className="w-full px-3 py-2 bg-background rounded-md border border-input"
                  >
                    <option value="">Select Section</option>
                    <option value="popular">Popular</option>
                    <option value="trending">Trending</option>
                    <option value="new">New Releases</option>
                    <option value="featured">Featured</option>
                    <option value="animations">Animations</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingMovie(null)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleEditSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
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

export default AdminManageMovies;
