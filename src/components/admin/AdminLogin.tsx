import { useState } from "react";
import { Lock, User, Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface AdminLoginProps {
  onLogin: () => void;
}

const ADMIN_USERNAME = "admin@muno";
const ADMIN_PASSWORD = "smartdevadmin12";

const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate a small delay for security perception
    setTimeout(() => {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Store session in sessionStorage (clears when browser closes)
        sessionStorage.setItem("adminAuthenticated", "true");
        sessionStorage.setItem("adminLoginTime", Date.now().toString());
        toast({ title: "Welcome, Admin!", description: "Successfully logged in" });
        onLogin();
      } else {
        toast({ 
          title: "Access Denied", 
          description: "Invalid credentials",
          variant: "destructive" 
        });
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            UGA<span className="text-primary">WATCH</span>
          </h1>
          <p className="text-muted-foreground mt-2">Admin Panel Access</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-muted rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full pl-10 pr-12 py-3 bg-muted rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-background/50 rounded"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Login to Admin Panel
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Authorized personnel only. All access is logged.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;