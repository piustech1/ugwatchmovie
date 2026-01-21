import { useState, useMemo } from "react";
import { User, Film, Edit2, Trash2, Plus, Search, X } from "lucide-react";
import { ref, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { useMovies } from "@/hooks/useMovies";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const AdminManageVJs = () => {
  const { movies } = useMovies();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingVJ, setEditingVJ] = useState<{ oldName: string; newName: string } | null>(null);
  const [newVJName, setNewVJName] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);

  // Get unique VJs with their movie counts
  const vjStats = useMemo(() => {
    const stats: { [key: string]: { count: number; movieIds: string[] } } = {};
    
    movies.forEach(movie => {
      const vj = movie.vj?.trim();
      if (vj) {
        if (!stats[vj]) {
          stats[vj] = { count: 0, movieIds: [] };
        }
        stats[vj].count++;
        stats[vj].movieIds.push(movie.id);
      }
    });

    return Object.entries(stats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [movies]);

  const filteredVJs = vjStats.filter(vj => 
    vj.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRenameVJ = async () => {
    if (!editingVJ || !editingVJ.newName.trim()) {
      toast({ title: "Enter a new name", variant: "destructive" });
      return;
    }

    const vjData = vjStats.find(v => v.name === editingVJ.oldName);
    if (!vjData) return;

    try {
      // Update all movies with this VJ
      const updates: { [key: string]: string } = {};
      vjData.movieIds.forEach(movieId => {
        updates[`movies/${movieId}/vj`] = editingVJ.newName.trim();
      });

      await update(ref(database), updates);
      toast({ title: `Renamed "${editingVJ.oldName}" to "${editingVJ.newName}" across ${vjData.count} movies` });
      setEditingVJ(null);
    } catch (error) {
      toast({ title: "Failed to rename VJ", variant: "destructive" });
    }
  };

  const handleRemoveVJ = async (vjName: string) => {
    if (!confirm(`Remove VJ "${vjName}" from all movies? This will clear the VJ field.`)) return;

    const vjData = vjStats.find(v => v.name === vjName);
    if (!vjData) return;

    try {
      const updates: { [key: string]: string } = {};
      vjData.movieIds.forEach(movieId => {
        updates[`movies/${movieId}/vj`] = "";
      });

      await update(ref(database), updates);
      toast({ title: `Removed VJ "${vjName}" from ${vjData.count} movies` });
    } catch (error) {
      toast({ title: "Failed to remove VJ", variant: "destructive" });
    }
  };

  const handleAssignVJ = async () => {
    if (!newVJName.trim() || selectedMovies.length === 0) {
      toast({ title: "Enter VJ name and select movies", variant: "destructive" });
      return;
    }

    try {
      const updates: { [key: string]: string } = {};
      selectedMovies.forEach(movieId => {
        updates[`movies/${movieId}/vj`] = newVJName.trim();
      });

      await update(ref(database), updates);
      toast({ title: `Assigned "${newVJName}" to ${selectedMovies.length} movies` });
      setShowAddDialog(false);
      setNewVJName("");
      setSelectedMovies([]);
    } catch (error) {
      toast({ title: "Failed to assign VJ", variant: "destructive" });
    }
  };

  const moviesWithoutVJ = movies.filter(m => !m.vj?.trim());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          Manage VJs
        </h1>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Assign VJ
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search VJs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-2xl font-bold text-foreground">{vjStats.length}</p>
          <p className="text-sm text-muted-foreground">Total VJs</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-2xl font-bold text-foreground">{moviesWithoutVJ.length}</p>
          <p className="text-sm text-muted-foreground">Movies without VJ</p>
        </div>
      </div>

      {/* VJ List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr,auto,auto] gap-4 p-3 bg-muted/50 text-sm font-semibold text-muted-foreground border-b border-border">
          <span>VJ Name</span>
          <span>Movies</span>
          <span>Actions</span>
        </div>
        
        <div className="divide-y divide-border">
          {filteredVJs.map(vj => (
            <div key={vj.name} className="grid grid-cols-[1fr,auto,auto] gap-4 p-3 items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {vj.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-foreground font-medium">{vj.name}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Film className="w-4 h-4" />
                <span className="text-sm">{vj.count}</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditingVJ({ oldName: vj.name, newName: vj.name })}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleRemoveVJ(vj.name)}
                  className="p-1.5 rounded hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredVJs.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? "No VJs match your search" : "No VJs found"}
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={!!editingVJ} onOpenChange={() => setEditingVJ(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename VJ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Current Name</label>
              <input
                type="text"
                value={editingVJ?.oldName || ""}
                disabled
                className="w-full px-3 py-2 bg-muted rounded-lg text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">New Name</label>
              <input
                type="text"
                value={editingVJ?.newName || ""}
                onChange={(e) => setEditingVJ(prev => prev ? { ...prev, newName: e.target.value } : null)}
                className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingVJ(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleRenameVJ} className="flex-1">
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign VJ Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign VJ to Movies</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">VJ Name</label>
              <input
                type="text"
                value={newVJName}
                onChange={(e) => setNewVJName(e.target.value)}
                placeholder="Enter VJ name..."
                className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Movies ({selectedMovies.length} selected)
              </label>
              <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                {moviesWithoutVJ.map(movie => (
                  <label
                    key={movie.id}
                    className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer border-b border-border last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMovies.includes(movie.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMovies([...selectedMovies, movie.id]);
                        } else {
                          setSelectedMovies(selectedMovies.filter(id => id !== movie.id));
                        }
                      }}
                      className="w-4 h-4 accent-primary"
                    />
                    <img src={movie.poster} alt={movie.title} className="w-8 h-12 object-cover rounded" />
                    <span className="text-sm text-foreground truncate">{movie.title}</span>
                  </label>
                ))}
                {moviesWithoutVJ.length === 0 && (
                  <p className="p-4 text-center text-muted-foreground text-sm">
                    All movies have VJs assigned
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAssignVJ} className="flex-1" disabled={!newVJName.trim() || selectedMovies.length === 0}>
                Assign VJ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManageVJs;
