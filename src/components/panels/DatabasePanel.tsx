import React, { useState, useEffect } from "react";
import { 
  supabase, 
  HAS_REAL_SUPABASE, 
  sandbox 
} from "../../lib/supabaseClient";
import { useVSCodeStore, flutterTemplateFiles } from "../../lib/store";
import { motion, AnimatePresence } from "motion/react";
import { 
  FolderGit2, 
  Plus, 
  X, 
  RefreshCw, 
  FolderOpen, 
  Trash2, 
  Check, 
  Database, 
  AlertCircle, 
  ShieldCheck, 
  Search,
  UserRound,
  FileCode,
  Sparkles
} from "lucide-react";

export function DatabasePanel() {
  const { 
    files, 
    loadProjectFiles,
    activeProjectId,
    setActiveProject,
    loadSupabaseChatMessages,
    user,
    projects,
    setProjects,
    setSidebarTab
  } = useVSCodeStore();

  const [projectName, setProjectName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  // Sync projects on mount and when user session changes
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

        if (error) throw error;
        setProjects(data || []);
      } else {
        const localProjs = sandbox.getProjects();
        setProjects(localProjs);
      }
    } catch (err: any) {
      console.error("Fetch projects error:", err);
      setErrorText(`Failed to retrieve saved projects: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Create & Save Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setErrorText("Project name is required.");
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
              name: projectName.trim(), 
              files: flutterTemplateFiles, 
              user_id: user?.id 
            }
          ])
          .select();

        if (error) throw error;
        const newProj = data?.[0];
        if (newProj) {
          setActiveProject(newProj.id, newProj.name);
          loadProjectFiles(newProj.files);
          await loadSupabaseChatMessages(newProj.id);
        }
        setSuccessText(`Project "${projectName}" successfully initialized with default Flutter code!`);
      } else {
        // Save locally inside the offline sandbox
        const savedProj = sandbox.saveProject(projectName.trim(), flutterTemplateFiles);
        if (savedProj) {
          setActiveProject(savedProj.id, savedProj.name);
          loadProjectFiles(savedProj.files);
          await loadSupabaseChatMessages(savedProj.id);
        }
        setSuccessText(`Sandbox Project "${projectName}" successfully initialized with default Flutter code!`);
      }

      setProjectName("");
      setShowCreateForm(false);
      fetchProjects();
    } catch (err: any) {
      console.error("Project creation error:", err);
      setErrorText(`Failed to instantiate project: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadProject = async (proj: any) => {
    try {
      loadProjectFiles(proj.files);
      setActiveProject(proj.id, proj.name);
      await loadSupabaseChatMessages(proj.id);
      setSuccessText(`Workspace changed to "${proj.name}"`);
      setTimeout(() => setSuccessText(null), 3000);
    } catch (err: any) {
      setErrorText(`Failed to swap project: ${err.message || err}`);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this workspace configuration from the database? This is permanent.")) return;

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
        setSuccessText("Project deleted from the cloud database.");
      } else {
        sandbox.deleteProject(id);
        setSuccessText("Sandbox project deleted.");
      }

      if (activeProjectId === id) {
        setActiveProject(null, null);
      }
      fetchProjects();
    } catch (err: any) {
      console.error("Delete configuration error:", err);
      setErrorText(`Deletion error: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter projects by search query
  const filteredProjects = projects.filter((proj: any) => 
    proj.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="vscode-database-panel" className="flex-1 flex flex-col h-full overflow-hidden bg-[#161622] text-slate-300 select-none text-[12px] font-sans">
      
      {/* Header bar with user projects & adding new project plus button */}
      <div className="p-3 border-b border-slate-800 bg-[#12121c] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200 text-xs">Database Projects</span>
        </div>

        <div className="flex items-center gap-1">
          {user && (
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              title={showCreateForm ? "Close Form" : "Create New Project"}
              className={`p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer flex items-center justify-center ${
                showCreateForm ? "bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300" : ""
              }`}
            >
              {showCreateForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4 text-emerald-400" />}
            </button>
          )}

          <button 
            onClick={fetchProjects}
            title="Reload Project Index"
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main scrolling layout */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        
        {/* Connection status notification */}
        {errorText && (
          <div className="p-2.5 bg-red-950/70 border border-red-900/40 text-red-300 rounded flex gap-2 items-start text-[11px]">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <p className="leading-tight">{errorText}</p>
          </div>
        )}

        {successText && (
          <div className="p-2.5 bg-emerald-950/70 border border-emerald-900/40 text-emerald-300 rounded flex gap-2 items-start text-[11px]">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <p className="leading-tight">{successText}</p>
          </div>
        )}

        {/* 1. NOT LOGGED IN WARNING & QUICK SWITCH */}
        {!user ? (
          <div className="bg-[#12121c] border border-slate-850 rounded-lg p-5 text-center space-y-3 shadow-md">
            <UserRound className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-300 text-[12px]">Authentication Required</p>
            <p className="text-[10px] leading-tight text-slate-500 max-w-xs mx-auto">
              Please sign in or continue in sandbox guest mode to access database save nodes.
            </p>
            <button 
              onClick={() => setSidebarTab("account")}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-1.5 rounded transition cursor-pointer flex items-center justify-center gap-1.5 text-[11px]"
            >
              <UserRound className="w-3.5 h-3.5" />
              <span>Sign In / Create Account</span>
            </button>
          </div>
        ) : (
          /* LOGGED IN VIEW */
          <div className="space-y-3">
            
            {/* Inline creation form */}
            <AnimatePresence>
              {showCreateForm && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateProject}
                  className="bg-[#12121c] border border-slate-800 rounded-lg p-3 space-y-2.5 overflow-hidden shadow-inner"
                >
                   <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold border-b border-slate-850 pb-1.5">
                    <span className="flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Create New Flutter Project</span>
                    </span>
                    <button 
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <input 
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. FlutterApp, CounterTemplate..."
                      maxLength={30}
                      required
                      className="w-full bg-[#0a0a0f] border border-slate-800 text-slate-100 placeholder-slate-600 rounded p-1.5 focus:border-blue-500 focus:outline-none text-[11px]"
                    />
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-start gap-1 leading-normal.5 bg-emerald-950/20 border border-emerald-950/40 rounded p-2 text-left">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>This project will be initialized with clean, standard Flutter counter application code automatically!</span>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading || !projectName.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white py-1 rounded font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Initialize Flutter Project</span>}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Quick search input */}
            {projects.length > 3 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1.5" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter key name..."
                  className="w-full bg-[#0c0f1a] border border-slate-850 rounded py-1 pl-7 pr-2.5 text-slate-300 placeholder-slate-650 focus:outline-none text-[10px]"
                />
              </div>
            )}

            {/* Projects list */}
            {filteredProjects.length === 0 ? (
              <div className="bg-[#12121c] border border-slate-850 rounded-lg p-6 text-center space-y-2.5 text-slate-500">
                <FolderGit2 className="w-7 h-7 mx-auto text-slate-700" />
                <p className="text-[11px] leading-tight font-medium text-slate-400">
                  {searchQuery ? "No matching queries" : "No saved configurations"}
                </p>
                {!showCreateForm && (
                  <button 
                    onClick={() => setShowCreateForm(true)}
                    className="px-3 py-1 bg-emerald-950/25 border border-emerald-900/35 hover:bg-emerald-950/45 rounded text-emerald-400 text-[10px] font-medium transition"
                  >
                    + Back Up Current Workspace
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredProjects.map((proj) => {
                  const isActive = activeProjectId === proj.id;
                  const dateObj = new Date(proj.updated_at);
                  const dateStr = dateObj.toLocaleDateString([], { 
                    month: "short", 
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <div 
                      key={proj.id}
                      onClick={() => handleLoadProject(proj)}
                      className={`p-2 bg-[#12121c] border rounded group transition-all duration-150 cursor-pointer flex items-center justify-between ${
                        isActive 
                          ? "border-emerald-500/80 bg-emerald-950/10 shadow-sm" 
                          : "border-slate-850 hover:border-slate-800"
                      }`}
                    >
                      <div className="min-w-0 max-w-[70%] text-left">
                        <div className="flex items-center gap-1.5">
                          <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-emerald-400" : "text-blue-400"}`} />
                          <span className={`truncate font-medium text-slate-200 ${isActive ? "text-emerald-400 font-bold" : ""}`}>
                            {proj.name}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5 truncate pl-5">
                          {dateStr} • {proj.files?.length || 0} files
                        </div>
                      </div>

                      <div className="flex items-center gap-1 pr-1">
                        {isActive && (
                          <span className="p-1 text-emerald-500">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <button
                          title="Restore files to edit panel"
                          className="p-1 text-slate-500 hover:text-blue-400 hover:bg-slate-850 rounded transition flex items-center justify-center"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteProject(proj.id, e)}
                          title="Erase project form DB"
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-850 rounded transition flex items-center justify-center"
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
        )}
      </div>
    </div>
  );
}
