import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/MainLayout";
import NetflixHero from "@/components/NetflixHero";
import ContentRow from "@/components/ContentRow";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import GenreChips from "@/components/GenreChips";
import WelcomeDialog from "@/components/WelcomeDialog";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { SkeletonHero, SkeletonRow } from "@/components/Skeletons";
import { useMovies } from "@/hooks/useMovies";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Flame, Clock, Tv, Film, Baby, Users, Archive, FileVideo } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const { 
    movies, 
    loading, 
    getFeaturedMovies, 
    getTrendingMovies, 
    getPopularMovies, 
    getNewReleases,
    getSeries,
    getBySection
  } = useMovies();

  // Get genre-based sections
  const kidsMovies = useMemo(() => 
    movies.filter(m => m.genre?.toLowerCase().includes('kids') || m.genre?.toLowerCase().includes('animation') || m.section === 'kids'),
    [movies]
  );
  
  const teensMovies = useMemo(() => 
    movies.filter(m => m.genre?.toLowerCase().includes('teen') || m.section === 'teens'),
    [movies]
  );
  
  const documentaryMovies = useMemo(() => 
    movies.filter(m => m.genre?.toLowerCase().includes('documentary') || m.section === 'documentary'),
    [movies]
  );
  
  const vintageMovies = useMemo(() => 
    movies.filter(m => parseInt(m.year) < 2000 || m.section === 'vintage'),
    [movies]
  );

  // Welcome page redirect temporarily disabled

  // Filter movies by selected genre
  const filteredMovies = useMemo(() => {
    if (!selectedGenre) return null;
    return movies.filter(m => 
      m.genre?.toLowerCase().includes(selectedGenre.toLowerCase())
    );
  }, [movies, selectedGenre]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <MainLayout>
        <SkeletonHero />
        <SkeletonRow />
        <SkeletonRow />
      </MainLayout>
    );
  }


  if (loading) {
    return (
      <MainLayout>
        <SkeletonHero />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </MainLayout>
    );
  }

  const featured = getFeaturedMovies();
  const trending = getTrendingMovies();
  const popular = getPopularMovies();
  const newReleases = getNewReleases();
  const series = getSeries();

  // Use new releases for hero, falling back to featured then popular
  // This ensures the newest uploaded content always shows first
  const heroMovies = newReleases.length > 0 
    ? newReleases.slice(0, 10) 
    : featured.length > 0 
      ? featured 
      : popular.slice(0, 5);

  return (
    <MainLayout>
      <WelcomeDialog />
      <PWAInstallPrompt />
      <NetflixHero movies={heroMovies} />
      
      {/* Genre Chips */}
      <GenreChips onGenreSelect={setSelectedGenre} selectedGenre={selectedGenre} />

      <div className="relative pb-6">
        {/* Filtered Content by Genre */}
        {selectedGenre && filteredMovies && (
          <ContentRow 
            title={selectedGenre} 
            icon={<Film className="w-4 h-4" />}
            movies={filteredMovies.slice(0, 15)} 
            seeMoreLink={`/category/${selectedGenre.toLowerCase()}`}
          />
        )}

        {/* Continue Watching */}
        {!selectedGenre && <ContinueWatchingRow />}
        
        {!selectedGenre && (
          <>
            {trending.length > 0 && (
              <ContentRow 
                title="Trending Now" 
                icon={<Flame className="w-4 h-4 text-orange-500" />}
                movies={trending.slice(0, 10)} 
                seeMoreLink="/trending"
              />
            )}
            
            {kidsMovies.length > 0 && (
              <ContentRow 
                title="Kids & Family" 
                icon={<Baby className="w-4 h-4 text-primary" />}
                movies={kidsMovies.slice(0, 10)} 
                seeMoreLink="/category/kids"
              />
            )}

            {teensMovies.length > 0 && (
              <ContentRow 
                title="Teens" 
                icon={<Users className="w-4 h-4 text-blue-500" />}
                movies={teensMovies.slice(0, 10)} 
                seeMoreLink="/category/teens"
              />
            )}

            {newReleases.length > 0 && (
              <ContentRow 
                title="New Releases" 
                icon={<Clock className="w-4 h-4 text-primary" />}
                movies={newReleases.slice(0, 10)} 
                seeMoreLink="/category/new"
              />
            )}

            {series.length > 0 && (
              <ContentRow 
                title="TV Series" 
                icon={<Tv className="w-4 h-4 text-secondary" />}
                movies={series.slice(0, 10)} 
                seeMoreLink="/category/series"
              />
            )}

            {documentaryMovies.length > 0 && (
              <ContentRow 
                title="Documentary" 
                icon={<FileVideo className="w-4 h-4 text-amber-500" />}
                movies={documentaryMovies.slice(0, 10)} 
                seeMoreLink="/category/documentary"
              />
            )}

            {vintageMovies.length > 0 && (
              <ContentRow 
                title="Vintage Classics" 
                icon={<Archive className="w-4 h-4 text-orange-400" />}
                movies={vintageMovies.slice(0, 10)} 
                seeMoreLink="/category/vintage"
              />
            )}

            {/* Adult Zone Button */}
            <section className="px-4 py-3">
              <button
                onClick={() => navigate("/adult")}
                className="w-full p-4 bg-gradient-to-r from-rose-950/50 to-pink-950/50 border border-rose-500/20 rounded-xl flex items-center gap-4 hover:border-rose-500/40 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">Adult Zone</h3>
                    <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] rounded font-bold">18+</span>
                  </div>
                  <p className="text-xs text-muted-foreground">PIN protected content</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                </div>
              </button>
            </section>
          </>
        )}

        {movies.length === 0 && !selectedGenre && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
              <Film className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">No Movies Yet</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Content is being added. Check back soon!
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Index;
