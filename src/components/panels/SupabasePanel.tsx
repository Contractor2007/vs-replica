import React, { useState, useEffect } from "react";
import { 
  supabase, 
  HAS_REAL_SUPABASE, 
  sandbox, 
  type SandboxProject 
} from "../../lib/supabaseClient";
import { useVSCodeStore } from "../../lib/store";
import { motion, AnimatePresence } from "motion/react";
import { 
  KeyRound, 
  LogIn, 
  UserPlus, 
  LogOut, 
  Save, 
  FolderGit2, 
  Trash2, 
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  FolderOpen,
  Database,
  Terminal,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

export function SupabasePanel() {
  const { 
    files, 
    loadProjectFiles,
    activeProjectId,
    setActiveProject,
    loadSupabaseChatMessages
  } = useVSCodeStore();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // App state
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentProjectName, setCurrentProjectName] = useState("");
  
  // UI Loading/Copy statuses
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  // 1. Sync User state on mount
  useEffect(() => {
    if (HAS_REAL_SUPABASE && supabase) {
      // Fetch initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || "" });
        }
      });

      // Handle auth changes
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
      // Use local sandbox user initial sync
      const guest = sandbox.getCurrentUser();
      if (guest) {
        setUser(guest);
      }
    }
  }, []);

  // 2. Fetch Projects list whenever User changes
  useEffect(() => {
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);
    setErrorText(null);

    try {
      if (HAS_REAL_SUPABASE && supabase) {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("updated_at", { ascending: false });

        if (error) {
          throw error;
        }
        setProjects(data || []);
      } else {
        // Fetch from local sandbox localStorage engine
        const localProjs = sandbox.getProjects();
        setProjects(localProjs);
      }
    } catch (err: any) {
      console.error("Fetch projects error:", err);
      setErrorText(`Failed to retrieve projects: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Authenticate Actions
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
          }
        } else {
          const { data, error } = await supabase.auth.signUp({
            email,
            password
          });
          if (error) throw error;
          if (data.user) {
            setSuccessText("Registration successful! Check email if verification is required.");
            // If auto login is disabled, inform user, else set user
            if (data.session?.user) {
              setUser({ id: data.session.user.id, email: data.session.user.email || "" });
            }
          }
        }
      } else {
        // Guest Local Sandbox auth mode
        if (activeTab === "login") {
          // Check if guest user credentials can be registered instantly as guest session
          const guestUser = { id: `guest_${email.split("@")[0]}`, email };
          sandbox.setCurrentUser(guestUser);
          setUser(guestUser);
          setSuccessText("Logged in as Sandbox Guest user!");
        } else {
          const guestUser = { id: `guest_${email.split("@")[0]}`, email };
          sandbox.setCurrentUser(guestUser);
          setUser(guestUser);
          setSuccessText("Sandbox account registered instantly!");
        }
      }

      // Reset fields
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorText(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Logout Action
  const handleSignOut = async () => {
    setLoading(true);
    try {
      if (HAS_REAL_SUPABASE && supabase) {
        await supabase.auth.signOut();
      } else {
        sandbox.setCurrentUser(null);
      }
      setUser(null);
      setProjects([]);
      setSuccessText("Signed out successfully.");
    } catch (err: any) {
      setErrorText(err.message || "Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  // 5. Create / Save Project
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProjectName.trim()) {
      setErrorText("Project name is required.");
      return;
    }

    if (!files || files.length === 0) {
      setErrorText("Your virtual workspace is empty! There code is required to save.");
      return;
    }

    setLoading(true);
    setErrorText(null);
    setSuccessText(null);

    try {
      if (HAS_REAL_SUPABASE && supabase) {
        const { data, error } = await supabase
          .from("projects")
          .insert([
            { 
              name: currentProjectName, 
              files: files, 
              user_id: user?.id 
            }
          ])
          .select();

        if (error) throw error;
        const newProj = data?.[0];
        if (newProj) {
          setActiveProject(newProj.id, newProj.name);
          await loadSupabaseChatMessages(newProj.id);
        }
        setSuccessText(`Project "${currentProjectName}" saved successfully in Supabase!`);
      } else {
        // Save in Sandbox localStorage engine
        const savedProj = sandbox.saveProject(currentProjectName, files);
        if (savedProj) {
          setActiveProject(savedProj.id, savedProj.name);
          await loadSupabaseChatMessages(savedProj.id);
        }
        setSuccessText(`Sandbox Project "${currentProjectName}" successfully saved locally!`);
      }

      setCurrentProjectName("");
      fetchProjects();
    } catch (err: any) {
      console.error("Save project error:", err);
      setErrorText(`Save failure: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // 6. Load Project and replace files
  const handleLoadProject = async (proj: any) => {
    try {
      loadProjectFiles(proj.files);
      setActiveProject(proj.id, proj.name);
      await loadSupabaseChatMessages(proj.id);
      setSuccessText(`Successfully loaded "${proj.name}"!`);
      
      // Auto-clear success message eventually
      setTimeout(() => {
        setSuccessText(null);
      }, 5000);
    } catch (err: any) {
      setErrorText(`Failed to load project structure: ${err.message || err}`);
    }
  };

  // 7. Delete Project
  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents triggers from loading the project too
    if (!window.confirm("Are you sure you want to delete this save? This action cannot be undone.")) return;

    setLoading(true);
    setErrorText(null);
    setSuccessText(null);

    try {
      if (HAS_REAL_SUPABASE && supabase) {
        const { error } = await supabase
          .from("projects")
          .delete()
          .eq("id", id);

        if (error) throw error;
        setSuccessText("Project deleted from Supabase.");
      } else {
        sandbox.deleteProject(id);
        setSuccessText("Sandbox project deleted.");
      }
      
      if (activeProjectId === id) {
        setActiveProject(null, null);
      }

      fetchProjects();
    } catch (err: any) {
      console.error("Delete project failure:", err);
      setErrorText(`Delete client failure: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Guest trigger helper
  const handleGuestMockLogin = () => {
    const dummyUser = { id: "guest_developer_account", email: "guest@saasforge.local" };
    sandbox.setCurrentUser(dummyUser);
    setUser(dummyUser);
    setSuccessText("Welcome! Connected in Guest Sandbox Mode.");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#161622] text-slate-300 select-none text-[12px] font-sans">
      
      {/* 1. Header connection badge row */}
      <div className="p-3 border-b border-slate-800 bg-[#12121c] flex flex-col gap-1.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200 text-xs">Supabase Storage</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${HAS_REAL_SUPABASE ? "bg-emerald-500 animate-pulse" : "bg-orange-500 animate-pulse"}`} />
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
              {HAS_REAL_SUPABASE ? "Live Supabase" : "Guest Sandbox"}
            </span>
          </div>
        </div>

        {/* Sandbox alert if no real keys */}
        {!HAS_REAL_SUPABASE && (
          <div className="mt-1 px-2.5 py-1.5 bg-orange-950/40 border border-orange-900/30 rounded text-slate-300 text-[10px] space-y-1">
            <div className="flex items-center gap-1 text-orange-400 font-bold uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Offline Fallback Active</span>
            </div>
            <p className="leading-relaxed font-normal text-[10px] text-slate-400">
              Supabase SDK is ready, but credentials are missing in <code className="text-orange-300 bg-orange-900/20 px-1 rounded font-mono">.env</code>.
            </p>
          </div>
        )}
      </div>

      {/* Main scrolling layout */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        
        {/* Error notification banner */}
        {errorText && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2.5 bg-red-950/70 border border-red-900/40 text-red-300 rounded flex gap-2 items-start"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <p className="leading-tight shrink">{errorText}</p>
          </motion.div>
        )}

        {/* Success notification banner */}
        {successText && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2.5 bg-emerald-950/70 border border-emerald-900/40 text-emerald-300 rounded flex gap-2 items-start"
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <p className="leading-tight shrink">{successText}</p>
          </motion.div>
        )}

        {/* 2. AUTHENTICATION SECTION (IF NOT LOGGED IN ANYWHERE) */}
        {!user ? (
          <div className="space-y-4 bg-[#12121c] p-3 rounded-lg border border-slate-800">
            <div className="flex bg-[#0a0a0f] p-0.5 rounded border border-slate-800">
              <button 
                onClick={() => setActiveTab("login")}
                className={`flex-1 py-1 text-center font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "login" 
                    ? "bg-slate-800 text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
              <button 
                onClick={() => setActiveTab("register")}
                className={`flex-1 py-1 text-center font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "register" 
                    ? "bg-slate-800 text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Email Address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-[#0a0a0f] border border-slate-800 text-slate-100 rounded p-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all font-mono"
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
                  className="w-full bg-[#0a0a0f] border border-slate-800 text-slate-100 rounded p-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all font-mono"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-1.5 rounded font-bold cursor-pointer transition shadow-sm hover:shadow flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : activeTab === "login" ? (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Access Workspace</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Free Account</span>
                  </>
                )}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800/80"></div></div>
              <div className="relative flex justify-center text-[9px] uppercase"><span className="bg-[#12121c] px-2 text-slate-500 font-bold">Or Sandbox Access</span></div>
            </div>

            <button 
              onClick={handleGuestMockLogin}
              className="w-full bg-[#1b1c2a] hover:bg-[#212338] border border-slate-800 text-slate-300 py-1.5 rounded font-medium cursor-pointer transition flex items-center justify-center gap-1.5 shadow-inner"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Continue in Guest Mode</span>
            </button>
          </div>
        ) : (
          
          // 3. SECURE WORKSPACE HUB AREA (LOGGED IN)
          <div className="space-y-4">
            
            {/* User Profile Badge */}
            <div className="bg-[#12121c] p-3 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Logged In User</span>
                  <div className="text-slate-100 font-mono font-medium truncate max-w-[150px]">{user.email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign out from system"
                  className="p-1 px-1.5 bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 rounded border border-slate-700/60 hover:border-red-900/30 transition-all cursor-pointer flex items-center gap-1.5 text-[10px]"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Exit</span>
                </button>
              </div>
            </div>

            {/* Save Current Workspace Form */}
            <div className="bg-[#12121c] p-3 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 text-slate-200 font-semibold mb-1">
                <Save className="w-3.5 h-3.5 text-blue-400" />
                <span>Save Active Workspace</span>
              </div>

              <form onSubmit={handleSaveProject} className="space-y-2.5">
                <div className="space-y-1">
                  <input 
                    type="text"
                    value={currentProjectName}
                    onChange={(e) => setCurrentProjectName(e.target.value)}
                    placeholder="E.g., TodoApp, FlutterSaaS"
                    maxLength={35}
                    required
                    className="w-full bg-[#0a0a0f] border border-slate-800 text-slate-100 rounded p-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all font-sans"
                  />
                </div>

                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Will copy ({files.length}) virtual workspace files.</span>
                </div>

                <button 
                  type="submit"
                  disabled={loading || !currentProjectName.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white py-1.5 rounded font-bold cursor-pointer transition shadow-sm hover:shadow flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Back Up Workspace</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* List of user projects from database */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-200 px-1">
                <span className="font-semibold flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>My Saved Projects ({projects.length})</span>
                </span>
                
                <button 
                  onClick={fetchProjects}
                  title="Reload list"
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="bg-[#12121c] border border-slate-800/80 rounded-lg p-6 text-center space-y-2 text-slate-500">
                  <FolderOpen className="w-6 h-6 mx-auto text-slate-600 animate-bounce" />
                  <p className="text-[11px] leading-tight">No saved project files found.</p>
                  <p className="text-[10px] text-slate-600 max-w-xs mx-auto">Scaffold or modify files inside the editor and back they up above!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {projects.map((proj) => {
                    const isActive = activeProjectId === proj.id;
                    const dateStr = new Date(proj.updated_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                    
                    return (
                      <div 
                        key={proj.id}
                        onClick={() => handleLoadProject(proj)}
                        className={`p-2.5 bg-[#12121c] border rounded-md cursor-pointer transition-all flex items-center justify-between group ${
                          isActive 
                            ? "border-emerald-500/80 bg-emerald-950/10 shadow-sm shadow-emerald-950/30" 
                            : "border-slate-800 hover:border-slate-700/80"
                        }`}
                      >
                        <div className="max-w-[70%] select-none">
                          <div className={`font-medium truncate text-slate-200 ${isActive ? "text-emerald-400 font-bold" : ""}`}>
                            {proj.name}
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                            {dateStr} • {proj.files?.length || 0} files
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-all">
                          <button
                            title="Load project files"
                            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteProject(proj.id, e)}
                            title="Delete configuration"
                            className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
