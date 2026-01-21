import { useState, useMemo } from "react";
import { Search as SearchIcon, SlidersHorizontal, X, Film, Calendar, User, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import MovieCard from "@/components/MovieCard";
import { useMovies } from "@/hooks/useMovies";
import { Button } from "@/components/ui/button";

type SortOption = "newest" | "oldest" | "popular" | "alphabetical";

const Search = () => {
  const { movies, loading } = useMovies();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedVj, setSelectedVj] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Extract filter options
  const genres = useMemo(() => {
    const allGenres = movies
      .map(m => m.genre)
      .filter(Boolean)
      .flatMap(g => g.split(/[,/]/).map(s => s.trim()));
    return Array.from(new Set(allGenres)).sort();
  }, [movies]);

  const years = useMemo(() => {
    const allYears = movies.map(m => m.year).filter(Boolean);
    return Array.from(new Set(allYears)).sort((a, b) => b.localeCompare(a));
  }, [movies]);

  const vjs = useMemo(() => {
    const allVjs = movies.map(m => m.vj).filter(Boolean);
    return Array.from(new Set(allVjs)).sort();
  }, [movies]);

  // Filter and sort movies
  const filteredMovies = useMemo(() => {
    let result = [...movies];

    // Search query
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(m => 
        m.title?.toLowerCase().includes(q) ||
        m.genre?.toLowerCase().includes(q) ||
        m.vj?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q)
      );
    }

    // Genre filter
    if (selectedGenre) {
      result = result.filter(m => m.genre?.toLowerCase().includes(selectedGenre.toLowerCase()));
    }

    // Year filter
    if (selectedYear) {
      result = result.filter(m => m.year === selectedYear);
    }

    // VJ filter
    if (selectedVj) {
      result = result.filter(m => m.vj === selectedVj);
    }

    // Sorting
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => (b.uploadDate || 0) - (a.uploadDate || 0));
        break;
      case "oldest":
        result.sort((a, b) => (a.uploadDate || 0) - (b.uploadDate || 0));
        break;
      case "popular":
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case "alphabetical":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [movies, query, selectedGenre, selectedYear, selectedVj, sortBy]);

  const hasActiveFilters = selectedGenre || selectedYear || selectedVj;

  const clearFilters = () => {
    setSelectedGenre(null);
    setSelectedYear(null);
    setSelectedVj(null);
  };

  return (
    <MainLayout>
      <div className="min-h-screen pt-20 pb-24">
        {/* Search Header */}
        <div className="px-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">Search</h1>
          
          {/* Search Input */}
          <div className="relative mb-4">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, series, VJs..."
              className="w-full h-12 pl-12 pr-12 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Filter Toggle & Sort */}
          <div className="flex items-center gap-3">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-5 h-5 rounded-full bg-primary-foreground text-primary text-xs flex items-center justify-center">
                  {[selectedGenre, selectedYear, selectedVj].filter(Boolean).length}
                </span>
              )}
            </Button>

            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="popular">Most Popular</option>
                <option value="alphabetical">A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 mb-6 overflow-hidden"
            >
              <div className="bg-card rounded-xl p-4 border border-border space-y-4">
                {/* Genre Filter */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Film className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Genre</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {genres.slice(0, 12).map((genre) => (
                      <button
                        key={genre}
                        onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          selectedGenre === genre
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Year Filter */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Year</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {years.slice(0, 10).map((year) => (
                      <button
                        key={year}
                        onClick={() => setSelectedYear(selectedYear === year ? null : year)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          selectedYear === year
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                {/* VJ Filter */}
                {vjs.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">VJ</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vjs.slice(0, 8).map((vj) => (
                        <button
                          key={vj}
                          onClick={() => setSelectedVj(selectedVj === vj ? null : vj)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            selectedVj === vj
                              ? "bg-secondary text-secondary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {vj}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                    Clear All Filters
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <div className="px-4">
          <p className="text-sm text-muted-foreground mb-4">
            {filteredMovies.length} {filteredMovies.length === 1 ? "result" : "results"} found
          </p>

          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-xl shimmer" />
              ))}
            </div>
          ) : filteredMovies.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {filteredMovies.map((movie, index) => (
                <MovieCard key={movie.id} movie={movie} index={index} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                <SearchIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Results Found</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Search;
