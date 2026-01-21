import { useCallback, useSyncExternalStore } from "react";

export interface Download {
  id: string;
  movieId: string;
  title: string;
  poster: string;
  backdrop?: string;
  episodeTitle?: string;
  season?: string;
  episode?: string;
  downloadedAt: number;
  fileSize?: number;
  status: "pending" | "downloading" | "completed" | "failed";
  progress: number;
}

const DOWNLOADS_KEY = "ugawatch_downloads";

function safeParseDownloads(raw: string | null): Download[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Download[]) : [];
  } catch {
    return [];
  }
}

function readDownloadsFromStorage(): Download[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParseDownloads(window.localStorage.getItem(DOWNLOADS_KEY));
  } catch {
    return [];
  }
}

function writeDownloadsToStorage(downloads: Download[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
  } catch {
    // ignore (quota/private mode)
  }
}

// Shared, cross-page store so Downloads updates immediately after starting a download
let cache: Download[] = readDownloadsFromStorage();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function setCache(next: Download[]) {
  cache = next;
  writeDownloadsToStorage(next);
  emit();
}

// Keep in sync across tabs/windows
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== DOWNLOADS_KEY) return;
    cache = readDownloadsFromStorage();
    emit();
  });
}

export const useDownloads = () => {
  const downloads = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => cache,
    () => []
  );

  const addDownload = useCallback(
    (
      movieId: string,
      title: string,
      poster: string,
      backdrop?: string,
      episodeInfo?: { season?: string; episode?: string; title?: string }
    ) => {
      const id = `${movieId}_${episodeInfo?.season || ""}_${episodeInfo?.episode || ""}_${Date.now()}`;

      const newDownload: Download = {
        id,
        movieId,
        title,
        poster,
        backdrop,
        episodeTitle: episodeInfo?.title,
        season: episodeInfo?.season,
        episode: episodeInfo?.episode,
        downloadedAt: Date.now(),
        status: "downloading",
        progress: 0,
      };

      setCache([newDownload, ...cache]);
      return id;
    },
    []
  );

  const updateDownloadProgress = useCallback((id: string, progress: number, status?: Download["status"]) => {
    setCache(
      cache.map((d) =>
        d.id === id ? { ...d, progress, status: status ?? d.status } : d
      )
    );
  }, []);

  const completeDownload = useCallback((id: string, fileSize?: number) => {
    setCache(
      cache.map((d) =>
        d.id === id ? { ...d, status: "completed", progress: 100, fileSize } : d
      )
    );
  }, []);

  const failDownload = useCallback((id: string) => {
    setCache(cache.map((d) => (d.id === id ? { ...d, status: "failed" } : d)));
  }, []);

  const removeDownload = useCallback((id: string) => {
    setCache(cache.filter((d) => d.id !== id));
  }, []);

  const clearAllDownloads = useCallback(() => {
    setCache([]);
  }, []);

  return {
    downloads,
    addDownload,
    updateDownloadProgress,
    completeDownload,
    failDownload,
    removeDownload,
    clearAllDownloads,
  };
};

