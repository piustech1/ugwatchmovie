const TMDB_API_KEY = "631793764968adbfd20238d39878e992";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export interface TMDBMovie {
  id: number;
  title: string;
  name?: string;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  genre_ids: number[];
}

export interface TMDBSeasonInfo {
  season_number: number;
  episode_count: number;
  name: string;
  poster_path: string | null;
}

export interface TMDBTVShowDetails {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: { id: number; name: string }[];
  seasons: TMDBSeasonInfo[];
}

export interface TMDBSeason {
  season_number: number;
  episodes: TMDBEpisode[];
}

export interface TMDBEpisode {
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
}

export const getImageUrl = (path: string | null, size: "w500" | "w780" | "w1280" | "original" = "w500") => {
  if (!path) return "/placeholder.svg";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const searchMovies = async (query: string): Promise<TMDBMovie[]> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error searching movies:", error);
    return [];
  }
};

export const searchTVShows = async (query: string): Promise<TMDBMovie[]> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error searching TV shows:", error);
    return [];
  }
};

export const getMovieDetails = async (movieId: number) => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`
    );
    return await response.json();
  } catch (error) {
    console.error("Error fetching movie details:", error);
    return null;
  }
};

export const getTVShowDetails = async (showId: number) => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${showId}?api_key=${TMDB_API_KEY}`
    );
    return await response.json();
  } catch (error) {
    console.error("Error fetching TV show details:", error);
    return null;
  }
};

export const getSeasonEpisodes = async (showId: number, seasonNumber: number): Promise<TMDBSeason | null> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${showId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`
    );
    return await response.json();
  } catch (error) {
    console.error("Error fetching season episodes:", error);
    return null;
  }
};

export const getTrending = async (mediaType: "movie" | "tv" = "movie"): Promise<TMDBMovie[]> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/trending/${mediaType}/week?api_key=${TMDB_API_KEY}`
    );
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching trending:", error);
    return [];
  }
};

export const getPopular = async (mediaType: "movie" | "tv" = "movie"): Promise<TMDBMovie[]> => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/${mediaType}/popular?api_key=${TMDB_API_KEY}`
    );
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching popular:", error);
    return [];
  }
};
