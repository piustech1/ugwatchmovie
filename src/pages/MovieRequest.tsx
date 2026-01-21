import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, CheckCircle, Film, User, Mic, MessageSquare } from "lucide-react";
import { ref, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useMovies } from "@/hooks/useMovies";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import MainLayout from "@/components/MainLayout";

const MovieRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { movies } = useMovies();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [randomBackdrop, setRandomBackdrop] = useState<string>("");
  const [formData, setFormData] = useState({
    movieTitle: "",
    userName: user?.displayName || "",
    preferredVJ: "",
    additionalNotes: "",
  });

  // Pick a random movie backdrop on mount
  useEffect(() => {
    if (movies.length > 0) {
      const moviesWithBackdrops = movies.filter(m => m.backdrop);
      if (moviesWithBackdrops.length > 0) {
        const randomMovie = moviesWithBackdrops[Math.floor(Math.random() * moviesWithBackdrops.length)];
        setRandomBackdrop(randomMovie.backdrop);
      }
    }
  }, [movies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.movieTitle.trim()) {
      toast({ title: "Error", description: "Please enter a movie title.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const requestsRef = ref(database, "movieRequests");
      await push(requestsRef, {
        ...formData,
        userId: user?.uid || "anonymous",
        userEmail: user?.email || "",
        timestamp: Date.now(),
        status: "pending",
      });

      setSubmitted(true);
      toast({ title: "Request Submitted!", description: "We'll add your movie soon." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit request.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center p-4 relative">
          {/* Background */}
          {randomBackdrop && (
            <div className="absolute inset-0">
              <img src={randomBackdrop} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/60" />
            </div>
          )}
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center relative z-10"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl shadow-primary/30"
            >
              <CheckCircle className="w-12 h-12 text-primary-foreground" />
            </motion.div>
            <h2 className="text-3xl font-bold text-foreground mb-3">Request Submitted!</h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              We've received your movie request and will work on adding it soon.
            </p>
            <Button size="lg" onClick={() => navigate("/")} className="px-8">
              Back to Home
            </Button>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen relative">
        {/* Background Backdrop */}
        {randomBackdrop && (
          <div className="absolute inset-0 h-[60vh]">
            <img src={randomBackdrop} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 pt-16 pb-8 px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Film className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Request a Movie</h1>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Can't find what you're looking for? Tell us and we'll add it!
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-lg mx-auto"
          >
            <div className="bg-card/95 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-border/50">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Movie Title */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Film className="w-4 h-4 text-primary" />
                    Movie / Series Title *
                  </label>
                  <input
                    type="text"
                    value={formData.movieTitle}
                    onChange={(e) => setFormData({ ...formData, movieTitle: e.target.value })}
                    placeholder="e.g., The Avengers, Breaking Bad"
                    required
                    className="w-full px-4 py-3.5 bg-muted/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary border border-border/50 transition-all"
                  />
                </div>

                {/* Your Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <User className="w-4 h-4 text-primary" />
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.userName}
                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3.5 bg-muted/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary border border-border/50 transition-all"
                  />
                </div>

                {/* Preferred VJ */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Mic className="w-4 h-4 text-primary" />
                    Preferred VJ
                  </label>
                  <input
                    type="text"
                    value={formData.preferredVJ}
                    onChange={(e) => setFormData({ ...formData, preferredVJ: e.target.value })}
                    placeholder="e.g., VJ Junior, VJ Emmy"
                    className="w-full px-4 py-3.5 bg-muted/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary border border-border/50 transition-all"
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                    placeholder="Any specific details, year, or version..."
                    rows={3}
                    className="w-full px-4 py-3.5 bg-muted/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary border border-border/50 resize-none transition-all"
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg shadow-primary/25" 
                  disabled={loading}
                >
                  <Send className="w-5 h-5 mr-2" />
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </div>

            {/* Footer Note */}
            <p className="text-center text-muted-foreground text-sm mt-6">
              We typically add requested movies within 24-48 hours
            </p>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MovieRequest;
