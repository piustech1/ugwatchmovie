import { useState } from "react";
import { Trash2, AlertTriangle, Loader2, Link2, Link2Off, RefreshCw, Download, Upload, Settings } from "lucide-react";
import { ref, remove, get, update, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LinkStatus {
  id: string;
  title: string;
  streamUrl: string;
  status: "checking" | "working" | "broken" | "unknown";
}

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const AdminSettings = () => {
  const [clearing, setClearing] = useState(false);
  const [checkingLinks, setCheckingLinks] = useState(false);
  const [linkStatuses, setLinkStatuses] = useState<LinkStatus[]>([]);
  const [showLinkChecker, setShowLinkChecker] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showFirebaseConfig, setShowFirebaseConfig] = useState(false);
  const [newConfig, setNewConfig] = useState<FirebaseConfig>({
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  });

  const handleClearAllData = async () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: This will permanently delete ALL data including movies, users, requests, and history. This action cannot be undone. Are you absolutely sure?"
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      "This is your final warning. Type 'DELETE' in the next prompt to confirm."
    );

    if (!doubleConfirm) return;

    const typed = window.prompt("Type DELETE to confirm:");
    if (typed !== "DELETE") {
      toast({ title: "Deletion cancelled", variant: "destructive" });
      return;
    }

    setClearing(true);
    try {
      // Clear all data nodes
      await Promise.all([
        remove(ref(database, "movies")),
        remove(ref(database, "users")),
        remove(ref(database, "movieRequests")),
        remove(ref(database, "watchHistory")),
        remove(ref(database, "favorites")),
        remove(ref(database, "notifications")),
        remove(ref(database, "adultContent")),
      ]);

      toast({ title: "All data cleared successfully" });
    } catch (error) {
      toast({ title: "Failed to clear data", variant: "destructive" });
    } finally {
      setClearing(false);
    }
  };

  // Export all data
  const handleExportData = async () => {
    setExporting(true);
    try {
      const dataNodes = ["movies", "users", "movieRequests", "watchHistory", "favorites", "notifications", "adultContent"];
      const exportData: Record<string, any> = {};

      for (const node of dataNodes) {
        const snapshot = await get(ref(database, node));
        if (snapshot.exists()) {
          exportData[node] = snapshot.val();
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ugawatch_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Data exported successfully", description: `Exported ${Object.keys(exportData).length} data collections` });
    } catch (error) {
      toast({ title: "Failed to export data", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  // Import data from file
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const confirmed = window.confirm(
        "⚠️ This will OVERWRITE existing data with the imported data. Continue?"
      );

      if (!confirmed) {
        setImporting(false);
        return;
      }

      for (const [node, nodeData] of Object.entries(data)) {
        if (nodeData && typeof nodeData === "object") {
          await set(ref(database, node), nodeData);
        }
      }

      toast({ title: "Data imported successfully", description: "All data has been restored" });
    } catch (error) {
      toast({ title: "Failed to import data", variant: "destructive", description: "Invalid backup file" });
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const checkStreamingLinks = async () => {
    setCheckingLinks(true);
    setShowLinkChecker(true);
    setLinkStatuses([]);

    try {
      const moviesRef = ref(database, "movies");
      const snapshot = await get(moviesRef);
      const data = snapshot.val();

      if (!data) {
        toast({ title: "No movies found" });
        setCheckingLinks(false);
        return;
      }

      const movies = Object.entries(data).map(([id, m]: [string, any]) => ({
        id,
        title: m.title,
        streamUrl: m.streamUrl || "",
        status: "checking" as const,
      }));

      setLinkStatuses(movies);

      // Check each link
      for (let i = 0; i < movies.length; i++) {
        const movie = movies[i];
        
        if (!movie.streamUrl) {
          setLinkStatuses(prev => 
            prev.map(m => m.id === movie.id ? { ...m, status: "broken" as const } : m)
          );
          continue;
        }

        try {
          // We can't directly check video URLs due to CORS, but we can check if it's a valid URL format
          const url = new URL(movie.streamUrl);
          const isValidFormat = url.protocol === "http:" || url.protocol === "https:";
          
          setLinkStatuses(prev => 
            prev.map(m => m.id === movie.id ? { 
              ...m, 
              status: isValidFormat ? "working" : "broken" 
            } : m)
          );
        } catch {
          setLinkStatuses(prev => 
            prev.map(m => m.id === movie.id ? { ...m, status: "broken" as const } : m)
          );
        }

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const broken = movies.filter(m => !m.streamUrl || m.streamUrl.trim() === "").length;
      toast({ 
        title: `Link check complete`, 
        description: `${broken} movies have missing/invalid stream URLs`
      });
    } catch (error) {
      toast({ title: "Failed to check links", variant: "destructive" });
    } finally {
      setCheckingLinks(false);
    }
  };

  const fixBrokenLink = async (movieId: string) => {
    const newUrl = window.prompt("Enter new stream URL:");
    if (!newUrl) return;

    try {
      await update(ref(database, `movies/${movieId}`), { streamUrl: newUrl });
      setLinkStatuses(prev => 
        prev.map(m => m.id === movieId ? { ...m, streamUrl: newUrl, status: "working" as const } : m)
      );
      toast({ title: "Stream URL updated" });
    } catch {
      toast({ title: "Failed to update URL", variant: "destructive" });
    }
  };

  const workingCount = linkStatuses.filter(l => l.status === "working").length;
  const brokenCount = linkStatuses.filter(l => l.status === "broken").length;
  const checkingCount = linkStatuses.filter(l => l.status === "checking").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>

      {/* Data Backup Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-6 border border-border"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Data Backup & Restore</h2>
            <p className="text-sm text-muted-foreground">Export all app data or restore from backup</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleExportData}
            disabled={exporting}
            className="gap-2"
            variant="outline"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export All Data
              </>
            )}
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={importing}
            />
            <Button
              variant="outline"
              className="gap-2"
              disabled={importing}
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Backup
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Export your data before migrating to a new Firebase project. The backup includes movies, users, requests, history, favorites, and notifications.
        </p>
      </motion.div>

      {/* Firebase Config Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card rounded-xl p-6 border border-border"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Firebase Configuration</h2>
            <p className="text-sm text-muted-foreground">View current config or update to new project</p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFirebaseConfig(!showFirebaseConfig)}
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          {showFirebaseConfig ? "Hide Config" : "Show Config Info"}
        </Button>

        {showFirebaseConfig && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-3">
              To migrate to a new Firebase project:
            </p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Export all your data using the backup feature above</li>
              <li>Create a new Firebase project at <a href="https://console.firebase.google.com" target="_blank" className="text-primary underline">Firebase Console</a></li>
              <li>Enable Realtime Database in your new project</li>
              <li>Get the new config from Project Settings → General → Your apps</li>
              <li>Update the firebase.ts file with the new configuration</li>
              <li>Import your backup data to the new project</li>
            </ol>
            <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-xs text-yellow-600">
                <strong>Note:</strong> Changing Firebase config requires editing src/lib/firebase.ts file directly. 
                Make sure to backup your data first!
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Link Checker Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl p-6 border border-border"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Stream Link Checker</h2>
            <p className="text-sm text-muted-foreground">Scan all movies for broken or missing stream URLs</p>
          </div>
        </div>

        <Button
          onClick={checkStreamingLinks}
          disabled={checkingLinks}
          className="gap-2"
        >
          {checkingLinks ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking Links...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Check All Links
            </>
          )}
        </Button>

        {showLinkChecker && linkStatuses.length > 0 && (
          <div className="mt-4">
            {/* Summary */}
            <div className="flex gap-4 mb-4 text-sm">
              <span className="text-muted-foreground">
                Checking: <span className="text-foreground font-medium">{checkingCount}</span>
              </span>
              <span className="text-primary">
                Working: <span className="font-medium">{workingCount}</span>
              </span>
              <span className="text-red-500">
                Broken: <span className="font-medium">{brokenCount}</span>
              </span>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto space-y-2 border border-border rounded-lg p-2">
              {linkStatuses
                .filter(l => l.status === "broken" || l.status === "checking")
                .map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {link.status === "checking" && (
                        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin flex-shrink-0" />
                      )}
                      {link.status === "working" && (
                        <Link2 className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                      {link.status === "broken" && (
                        <Link2Off className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                      <span className="text-sm text-foreground truncate">{link.title}</span>
                    </div>
                    {link.status === "broken" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => fixBrokenLink(link.id)}
                        className="text-xs"
                      >
                        Fix
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl p-6 border border-destructive/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Danger Zone</h2>
            <p className="text-sm text-muted-foreground">Irreversible and destructive actions</p>
          </div>
        </div>

        <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-foreground">Clear All App Data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This will permanently delete all movies, users, requests, watch history, favorites, and notifications. 
                This action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleClearAllData}
              disabled={clearing}
              className="flex-shrink-0"
            >
              {clearing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSettings;