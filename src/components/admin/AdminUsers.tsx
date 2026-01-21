import { useState, useEffect } from "react";
import { Users, Search, Mail, Calendar } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  joined: number;
  subscription: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const usersRef = ref(database, "users");
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersArray = Object.entries(data).map(([id, user]) => ({
          id,
          ...(user as Omit<UserProfile, "id">)
        })).sort((a, b) => b.joined - a.joined);
        setUsers(usersArray);
      } else {
        setUsers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <span className="px-3 py-1 bg-purple-500/20 text-purple-500 text-sm font-semibold rounded-full">
          {users.length} total
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2 bg-card rounded-lg text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 shimmer rounded-xl" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary-foreground">
                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{user.name || "Unnamed User"}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Joined {formatDate(user.joined)}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      user.subscription === "premium" 
                        ? "bg-primary/20 text-primary" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {user.subscription || "free"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground mt-4">
        Showing {filteredUsers.length} of {users.length} users
      </p>
    </div>
  );
};

export default AdminUsers;
