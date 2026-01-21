import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Trash2, Play, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { useDownloads, Download as DownloadType } from "@/hooks/useDownloads";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "Unknown size";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
};

const getStatusIcon = (status: DownloadType["status"]) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-4 h-4 text-primary" />;
    case "downloading":
      return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    case "failed":
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    default:
      return <Download className="w-4 h-4 text-muted-foreground" />;
  }
};

const getStatusText = (status: DownloadType["status"], progress: number) => {
  switch (status) {
    case "completed":
      return "Downloaded";
    case "downloading":
      return `Downloading ${progress}%`;
    case "failed":
      return "Failed";
    default:
      return "Pending";
  }
};

const Downloads = () => {
  const navigate = useNavigate();
  const { downloads, removeDownload, clearAllDownloads } = useDownloads();
  const [filter, setFilter] = useState<"all" | "completed" | "downloading">("all");

  const filteredDownloads = downloads.filter((d) => {
    if (filter === "all") return true;
    if (filter === "completed") return d.status === "completed";
    if (filter === "downloading") return d.status === "downloading" || d.status === "pending";
    return true;
  });

  const handlePlay = (download: DownloadType) => {
    navigate(`/movie/${download.movieId}`);
  };

  const handleDelete = (id: string) => {
    removeDownload(id);
    toast.success("Download removed");
  };

  const handleClearAll = () => {
    clearAllDownloads();
    toast.success("All downloads cleared");
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background pb-24 pt-16">
        {/* Header */}
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-xl font-bold">Downloads</h1>
              <p className="text-xs text-muted-foreground">
                {downloads.length} {downloads.length === 1 ? "item" : "items"}
              </p>
            </div>

            {downloads.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all downloads?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all downloaded content from your device. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground">
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 px-4 pb-3">
            {(["all", "completed", "downloading"] as const).map((tab) => (
              <Button
                key={tab}
                variant={filter === tab ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(tab)}
                className="capitalize"
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>

        {/* Downloads List */}
        <div className="p-4">
          {filteredDownloads.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Download className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-2">No downloads yet</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Download movies and shows to watch them offline anytime
              </p>
              <Button
                variant="default"
                className="mt-6"
                onClick={() => navigate("/")}
              >
                Browse Content
              </Button>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {filteredDownloads.map((download, index) => (
                  <motion.div
                    key={download.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-xl overflow-hidden border border-border"
                  >
                    <div className="flex gap-3 p-3">
                      {/* Thumbnail */}
                      <div 
                        className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0 cursor-pointer"
                        onClick={() => handlePlay(download)}
                      >
                        <img
                          src={download.backdrop || download.poster}
                          alt={download.title}
                          className="w-full h-full object-cover"
                        />
                        {download.status === "completed" && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play className="w-6 h-6 text-white fill-white" />
                          </div>
                        )}
                        {download.status === "downloading" && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${download.progress}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{download.title}</h3>
                        {download.episodeTitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {download.season?.replace("_", " ")} • {download.episodeTitle}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(download.status)}
                          <span className="text-xs text-muted-foreground">
                            {getStatusText(download.status, download.progress)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(download.downloadedAt)} • {formatFileSize(download.fileSize)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(download.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Downloads;
