import React, { useState, useEffect } from "react";
import { 
  supabase, 
  HAS_REAL_SUPABASE, 
  sandbox 
} from "../../lib/supabaseClient";
import { useVSCodeStore } from "../../lib/store";
import { motion, AnimatePresence } from "motion/react";
import { 
  LogIn, 
  UserPlus, 
  LogOut, 
  Sparkles, 
  RefreshCw, 
  UserRound,
  ShieldCheck, 
  AlertCircle,
  KeyRound,
  FolderGit2
} from "lucide-react";

export function AccountPanel() {
  const { 
    user, 
    setUser, 
    setProjects,
    activeProjectId,
    setActiveProject,
    setSidebarTab
  } = useVSCodeStore();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  // Synchronize Auth sessions on mount
  useEffect(() => {
    if (HAS_REAL_SUPABASE && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || "" });
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || "" });
        } else {
          setUser(null);
          setProjects([]);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      const guest = sandbox.getCurrentUser();
      if (guest) {
        setUser(guest);
      }
    }
  }, [setUser, setProjects]);

  // Handle Log In / Registration
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorText("Email and password are required.");
      return;
    }

    setLoading(true);
    setErrorText(null);
    setSuccessText(null);

    try {
      if (HAS_REAL_SUPABASE && supabase) {
        if (activeTab === "login") {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (error) throw error;
          if (data.user) {
            setUser({ id: data.user.id, email: data.user.email || "" });
            setSuccessText("Logged in successfully!");
            setTimeout(() => setSidebarTab("database"), 1000); // Switch to projects list
          }
        } else {
          const { data, error } = await supabase.auth.signUp({
            email,
            password
          });
          if (error) throw error;
          if (data.user) {
            setSuccessText("Registration successful! Check email if validation is required.");
            if (data.session?.user) {
              setUser({ id: data.session.user.id, email: data.session.user.email || "" });
              setTimeout(() => setSidebarTab("database"), 1000);
            }
          }
        }
      } else {
        // Sandboxed simulated experience
        const guestUser = { id: `guest_${email.split("@")[0]}`, email };
        sandbox.setCurrentUser(guestUser);
        setUser(guestUser);
        setSuccessText("Logged in as Guest (Sandbox local)!");
        setTimeout(() => setSidebarTab("database"), 1000);
      }

      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorText(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setErrorText(null);
    setSuccessText(null);
    try {
      if (HAS_REAL_SUPABASE && supabase) {
        await supabase.auth.signOut();
      } else {
        sandbox.setCurrentUser(null);
      }
      setUser(null);
      setProjects([]);
      setActiveProject(null, null);
      setSuccessText("Signed out successfully.");
    } catch (err: any) {
      setErrorText(err.message || "Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMockLogin = () => {
    const dummyUser = { id: "guest_developer_account", email: "guest@saasforge.local" };
    sandbox.setCurrentUser(dummyUser);
    setUser(dummyUser);
    setSuccessText("Connected in Sandbox Guest Mode.");
    setTimeout(() => setSidebarTab("database"), 1000);
  };

  return (
    <div id="vscode-account-panel" className="flex-1 flex flex-col h-full overflow-hidden bg-[#161622] text-slate-300 select-none text-[12px] font-sans">
      
      {/* Header bar */}
      <div className="p-3 border-b border-slate-800 bg-[#12121c] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <UserRound className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-slate-200 text-xs">Developer Account</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${HAS_REAL_SUPABASE ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
          <span className="text-[9px] uppercase font-mono font-bold text-slate-400">
            {HAS_REAL_SUPABASE ? "Cloud Connected" : "Sandbox"}
          </span>
        </div>
      </div>

      {/* Scrollable Layout */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        
        {/* Connection Mode warning if offline sandbox */}
        {!HAS_REAL_SUPABASE && (
          <div className="px-2.5 py-1.5 bg-amber-950/20 border border-amber-900/30 rounded text-slate-300 text-[10px] space-y-1">
            <div className="flex items-center gap-1 text-amber-500 font-bold uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span>Offline Sandbox Active</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Projects will be persisted to browser-local storage. Fill out environment variables inside Settings to enable live Supabase sync.
            </p>
          </div>
        )}

        {/* Notifications */}
        {errorText && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-2.5 bg-red-950/70 border border-red-900/40 text-red-300 rounded flex gap-2 items-start"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <p className="leading-tight shrink">{errorText}</p>
          </motion.div>
        )}

        {successText && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-2.5 bg-emerald-950/70 border border-emerald-900/40 text-emerald-300 rounded flex gap-2 items-start"
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <p className="leading-tight shrink">{successText}</p>
          </motion.div>
        )}

        {/* Session check */}
        {!user ? (
          <div className="space-y-4 bg-[#12121c] p-3.5 rounded-lg border border-slate-800 shadow-lg">
            {/* Header selection tab */}
            <div className="flex bg-[#0a0a0f] p-0.5 rounded border border-slate-800">
              <button 
                onClick={() => setActiveTab("login")}
                className={`flex-1 py-1.5 text-center font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "login" 
                    ? "bg-slate-800 text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button 
                onClick={() => setActiveTab("register")}
                className={`flex-1 py-1.5 text-center font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "register" 
                    ? "bg-slate-800 text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Email Address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-[#0a0a0f] border border-slate-800 text-slate-100 rounded p-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Password</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0a0a0f] border border-slate-800 text-slate-100 rounded p-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all font-mono text-[11px]"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-1.5 rounded font-bold cursor-pointer transition shadow-sm hover:shadow flex items-center justify-center gap-1.5 disabled:opacity-55"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : activeTab === "login" ? (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Access Sandbox</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Profile</span>
                  </>
                )}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800/80" /></div>
              <div className="relative flex justify-center text-[9px] uppercase"><span className="bg-[#12121c] px-2 text-slate-500 font-bold">Or Sandbox Access</span></div>
            </div>

            {/* Quick Guest login option */}
            <button 
              onClick={handleGuestMockLogin}
              className="w-full bg-[#1b1c2a] hover:bg-[#212338] border border-slate-800 text-slate-300 py-1.5 rounded font-medium cursor-pointer transition flex items-center justify-center gap-1.5 shadow-inner text-[11px]"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Continue in Guest Mode</span>
            </button>
          </div>
        ) : (
          /* Profile area */
          <div className="space-y-4">
            <div className="bg-[#12121c] p-3.5 rounded-lg border border-slate-800 space-y-3.5 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-900/40 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-sm">
                  {user.email.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Active Account</div>
                  <div className="text-slate-200 font-semibold font-mono truncate text-[11px]">{user.email}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>Connection Mode:</span>
                  <span className="font-semibold text-slate-300 font-mono">
                    {HAS_REAL_SUPABASE ? "Cloud database" : "Guest Local Space"}
                  </span>
                </div>
                {activeProjectId && (
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Focused Project:</span>
                    <span className="font-semibold text-emerald-400 font-mono">
                      Connected
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full mt-2 py-1.5 bg-slate-850 hover:bg-red-950/40 border border-slate-800 hover:border-red-900/40 text-slate-400 hover:text-red-300 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[11px]"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                <span>Log Out of System</span>
              </button>
            </div>

            {/* Quick Action Box */}
            <div className="bg-[#12121c]/40 border border-slate-800/80 rounded-lg p-3.5 space-y-2 text-center text-slate-400">
              <FolderGit2 className="w-5 h-5 mx-auto text-blue-500/70" />
              <p className="font-semibold text-slate-200 text-[11px]">Database is Sync-Ready</p>
              <p className="text-[10px] leading-tight text-slate-500">
                You are authenticated and ready to save, reload, and organize project configurations inside the Projects tab.
              </p>
              <button 
                onClick={() => setSidebarTab("database")}
                className="mt-1 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 rounded text-blue-400 font-medium transition text-[10px]"
              >
                View Database Projects &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
