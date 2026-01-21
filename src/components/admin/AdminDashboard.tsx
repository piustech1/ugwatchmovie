import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Film,
  Tv,
  Users,
  Eye,
  MessageSquare,
  TrendingUp,
  Plus,
  Bell,
  Activity,
  Clock,
  ChevronRight,
  BarChart3,
  Play,
  Heart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";

type AdminSection = "dashboard" | "add-movie" | "add-series" | "manage-movies" | "requests" | "notifications" | "users";

interface AdminDashboardProps {
  setActiveSection: (section: AdminSection) => void;
}

interface RecentActivity {
  type: "movie" | "user" | "request" | "view";
  title: string;
  timestamp: number;
  icon: typeof Film;
  color: string;
}

const AdminDashboard = ({ setActiveSection }: AdminDashboardProps) => {
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalSeries: 0,
    totalUsers: 0,
    totalRequests: 0,
    totalViews: 0,
    pendingRequests: 0,
    newUsersToday: 0,
    activeUsers: 0,
  });
  const [topMovies, setTopMovies] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [genreStats, setGenreStats] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    const moviesRef = ref(database, "movies");
    const usersRef = ref(database, "users");
    const requestsRef = ref(database, "movieRequests");

    const unsubMovies = onValue(moviesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const movies = Object.entries(data).map(([id, m]: [string, any]) => ({ id, ...m }));
        const totalMovies = movies.filter((m) => !m.isSeries).length;
        const totalSeries = movies.filter((m) => m.isSeries).length;
        const totalViews = movies.reduce((sum, m) => sum + (m.views || 0), 0);

        // Top movies by views
        const sorted = [...movies].sort((a, b) => (b.views || 0) - (a.views || 0));
        setTopMovies(sorted.slice(0, 5));

        // Genre stats
        const genres: { [key: string]: number } = {};
        movies.forEach((m) => {
          if (m.genre) {
            const genreList = m.genre.split(",").map((g: string) => g.trim());
            genreList.forEach((g: string) => {
              genres[g] = (genres[g] || 0) + 1;
            });
          }
        });
        const genreArray = Object.entries(genres)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);
        setGenreStats(genreArray);

        setStats((prev) => ({ ...prev, totalMovies, totalSeries, totalViews }));

        // Recent movie activity
        const recentMovies = movies
          .filter((m) => m.uploadDate)
          .sort((a, b) => b.uploadDate - a.uploadDate)
          .slice(0, 3)
          .map((m) => ({
            type: "movie" as const,
            title: `Added: ${m.title}`,
            timestamp: m.uploadDate,
            icon: Film,
            color: "text-primary",
          }));
        setRecentActivity((prev) => [...recentMovies, ...prev.filter((a) => a.type !== "movie")].slice(0, 8));
      }
    });

    const unsubUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const users = Object.values(data) as any[];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newUsersToday = users.filter((u) => u.joined && u.joined > today.getTime()).length;
        setStats((prev) => ({
          ...prev,
          totalUsers: users.length,
          newUsersToday,
          activeUsers: Math.floor(users.length * 0.3),
        }));
      }
    });

    const unsubRequests = onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const requests = Object.values(data) as any[];
        const pendingRequests = requests.filter((r) => r.status !== "completed").length;
        setStats((prev) => ({
          ...prev,
          totalRequests: requests.length,
          pendingRequests,
        }));
      }
    });

    return () => {
      unsubMovies();
      unsubUsers();
      unsubRequests();
    };
  }, []);

  const statCards = [
    {
      label: "Total Movies",
      value: stats.totalMovies,
      icon: Film,
      color: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
      trend: "+12%",
      trendUp: true,
    },
    {
      label: "Total Series",
      value: stats.totalSeries,
      icon: Tv,
      color: "from-blue-500/20 to-blue-500/5",
      iconColor: "text-blue-500",
      trend: "+8%",
      trendUp: true,
    },
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "from-purple-500/20 to-purple-500/5",
      iconColor: "text-purple-500",
      trend: `+${stats.newUsersToday} today`,
      trendUp: true,
    },
    {
      label: "Total Views",
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: "from-pink-500/20 to-pink-500/5",
      iconColor: "text-pink-500",
      trend: "+24%",
      trendUp: true,
    },
    {
      label: "Movie Requests",
      value: stats.totalRequests,
      icon: MessageSquare,
      color: "from-orange-500/20 to-orange-500/5",
      iconColor: "text-orange-500",
      trend: `${stats.pendingRequests} pending`,
      trendUp: false,
    },
    {
      label: "Active Users",
      value: stats.activeUsers,
      icon: Activity,
      color: "from-cyan-500/20 to-cyan-500/5",
      iconColor: "text-cyan-500",
      trend: "Online now",
      trendUp: true,
    },
  ];

  const quickActions: { label: string; icon: typeof Film; section: AdminSection; color: string }[] = [
    { label: "Add Movie", icon: Plus, section: "add-movie", color: "bg-primary" },
    { label: "Add Series", icon: Tv, section: "add-series", color: "bg-blue-500" },
    { label: "Send Alert", icon: Bell, section: "notifications", color: "bg-orange-500" },
    { label: "View Users", icon: Users, section: "users", color: "bg-purple-500" },
    { label: "Requests", icon: MessageSquare, section: "requests", color: "bg-pink-500" },
    { label: "Manage", icon: Film, section: "manage-movies", color: "bg-cyan-500" },
  ];

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const maxGenreCount = Math.max(...genreStats.map((g) => g.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, Admin</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Last updated:</span>
          <span className="text-xs text-primary">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative bg-gradient-to-br ${stat.color} rounded-xl p-4 border border-border overflow-hidden`}
            >
              <div className="absolute top-2 right-2">
                <div className={`w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-4">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <div className="flex items-center gap-1 mt-2">
                {stat.trendUp ? (
                  <ArrowUpRight className="w-3 h-3 text-primary" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-orange-500" />
                )}
                <span className={`text-xs ${stat.trendUp ? "text-primary" : "text-orange-500"}`}>{stat.trend}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-lg font-bold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => setActiveSection(action.section)}
                className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border hover:border-primary transition-all hover:scale-105"
              >
                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Movies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl p-4 border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Top Movies
            </h2>
            <button
              onClick={() => setActiveSection("manage-movies")}
              className="text-xs text-primary hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {topMovies.map((movie, index) => (
              <div key={movie.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <img
                  src={movie.poster || "/placeholder.svg"}
                  alt={movie.title}
                  className="w-10 h-14 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{movie.title}</p>
                  <p className="text-xs text-muted-foreground">{movie.vj || "Unknown VJ"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{(movie.views || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">views</p>
                </div>
              </div>
            ))}
            {topMovies.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No movies yet</p>
            )}
          </div>
        </motion.div>

        {/* Genre Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl p-4 border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Genre Distribution
            </h2>
          </div>
          <div className="space-y-3">
            {genreStats.map((genre) => (
              <div key={genre.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{genre.name}</span>
                  <span className="text-muted-foreground">{genre.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(genre.count / maxGenreCount) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full"
                  />
                </div>
              </div>
            ))}
            {genreStats.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No genre data</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity & Pending Requests */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-xl p-4 border border-border"
        >
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </div>
        </motion.div>

        {/* Quick Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-3xl font-bold text-foreground">{stats.pendingRequests}</p>
              </div>
              <button
                onClick={() => setActiveSection("requests")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                View All
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Users Today</p>
                <p className="text-3xl font-bold text-foreground">{stats.newUsersToday}</p>
              </div>
              <button
                onClick={() => setActiveSection("users")}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-500/90"
              >
                View All
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Content Library</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalMovies + stats.totalSeries}</p>
              </div>
              <button
                onClick={() => setActiveSection("manage-movies")}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-500/90"
              >
                Manage
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
