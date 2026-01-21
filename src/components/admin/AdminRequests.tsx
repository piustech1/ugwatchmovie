import { useState, useEffect } from "react";
import { Check, Trash2, Clock, Loader2 } from "lucide-react";
import { ref, onValue, update, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";

interface MovieRequest {
  id: string;
  movieTitle: string;
  userName: string;
  userEmail: string;
  preferredVJ: string;
  additionalNotes: string;
  timestamp: number;
  status: "pending" | "completed";
}

const AdminRequests = () => {
  const [requests, setRequests] = useState<MovieRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const requestsRef = ref(database, "movieRequests");
    
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const requestsArray = Object.entries(data).map(([id, request]) => ({
          id,
          ...(request as Omit<MovieRequest, "id">)
        })).sort((a, b) => b.timestamp - a.timestamp);
        setRequests(requestsArray);
      } else {
        setRequests([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markComplete = async (requestId: string) => {
    setProcessing(requestId);
    try {
      await update(ref(database, `movieRequests/${requestId}`), { 
        status: "completed",
        completedAt: Date.now()
      });
      toast({ title: "Request marked as complete" });
    } catch (error) {
      toast({ title: "Failed to update request", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;
    
    setProcessing(requestId);
    try {
      await remove(ref(database, `movieRequests/${requestId}`));
      toast({ title: "Request deleted" });
    } catch (error) {
      toast({ title: "Failed to delete request", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Movie Requests</h1>
        <span className="px-3 py-1 bg-orange-500/20 text-orange-500 text-sm font-semibold rounded-full">
          {pendingCount} pending
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 shimmer rounded-xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No movie requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div 
              key={request.id} 
              className={`bg-card rounded-xl p-4 border ${request.status === "completed" ? "border-primary/30" : "border-border"}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{request.movieTitle}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      request.status === "completed" 
                        ? "bg-primary/20 text-primary" 
                        : "bg-orange-500/20 text-orange-500"
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Requested by: {request.userName || "Anonymous"} 
                    {request.userEmail && ` (${request.userEmail})`}
                  </p>
                  {request.preferredVJ && (
                    <p className="text-sm text-muted-foreground">
                      Preferred VJ: <span className="text-secondary">{request.preferredVJ}</span>
                    </p>
                  )}
                  {request.additionalNotes && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      "{request.additionalNotes}"
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDate(request.timestamp)}
                  </p>
                </div>

                <div className="flex gap-2 ml-4">
                  {request.status === "pending" && (
                    <button
                      onClick={() => markComplete(request.id)}
                      disabled={processing === request.id}
                      className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                    >
                      {processing === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => deleteRequest(request.id)}
                    disabled={processing === request.id}
                    className="p-2 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRequests;
