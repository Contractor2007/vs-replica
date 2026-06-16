import React from "react";
import { useVSCodeStore } from "../../lib/store";
import { GitBranch, Check, Plus, Minus, FileCode, CheckSquare } from "lucide-react";

export function GitPanel() {
  const {
    gitModifiedFiles,
    gitCommitMessage,
    gitCommitHistory,
    setGitMessage,
    commitChanges,
    stageFile,
    stageAllFiles,
    unstageAllFiles,
    openFileInTab
  } = useVSCodeStore();

  const stagedFiles = gitModifiedFiles.filter((f) => f.staged);
  const unstagedFiles = gitModifiedFiles.filter((f) => !f.staged);

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();
    commitChanges();
  };

  return (
    <div id="vscode-git-panel" className="h-full flex flex-col min-h-0 bg-[#161622] text-slate-300">
      {/* Header bar */}
      <div className="px-4 py-2 bg-[#12121d] flex items-center justify-between border-b border-slate-800/50">
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748b] font-mono select-none flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-blue-400" />
          Source Control: Git
        </span>
        <span className="text-[10px] uppercase font-bold font-mono tracking-wide text-slate-400">
          branch: main
        </span>
      </div>

      {/* Commit Input form */}
      <div className="p-3 shrink-0 flex flex-col gap-2 bg-[#161622] border-b border-slate-800/30">
        <form onSubmit={handleCommit} className="flex flex-col gap-2">
          <textarea
            value={gitCommitMessage}
            onChange={(e) => setGitMessage(e.target.value)}
            placeholder="Commit message (Ctrl+Enter to commit to main)..."
            className="w-full bg-[#0c0c14] border border-slate-850 rounded p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono resize-none h-18 text-[11px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                commitChanges();
              }
            }}
          />
          <button
            type="submit"
            disabled={stagedFiles.length === 0}
            className={`w-full py-2 rounded font-semibold text-xs transition duration-150 flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider ${
              stagedFiles.length > 0
                ? "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-98"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            <Check className="w-4 h-4" />
            Commit ({stagedFiles.length} files)
          </button>
        </form>
      </div>

      {/* Files List status details section */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-4 scrollbar-thin">
        {gitModifiedFiles.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-10 font-mono select-none leading-relaxed px-4">
            No changes detected. Edit any file in the workspace to initiate Git tracking!
          </div>
        ) : (
          <>
            {/* 1. Staged Changes Block */}
            {stagedFiles.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono flex items-center gap-1">
                    Staged Changes
                    <span className="bg-slate-800 text-slate-300 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                      {stagedFiles.length}
                    </span>
                  </span>
                  <button 
                    onClick={unstageAllFiles} 
                    className="text-[10px] text-blue-400 hover:underline font-mono"
                  >
                    Unstage All
                  </button>
                </div>

                <div className="space-y-1">
                  {stagedFiles.map((f) => (
                    <div 
                      key={f.path}
                      className="group flex items-center justify-between py-1 px-2 hover:bg-slate-850 rounded"
                    >
                      <button
                        onClick={() => openFileInTab(f.path)}
                        className="flex items-center gap-1.5 text-xs font-mono text-emerald-450 truncate"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span className="truncate">{f.path.split("/").pop()}</span>
                        <span className="text-[10px] text-slate-500">_stage</span>
                      </button>
                      <button
                        onClick={() => stageFile(f.path, false)}
                        title="Unstage changes"
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-750 text-slate-400 hover:text-white rounded"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Changes Block */}
            {unstagedFiles.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748b] font-mono flex items-center gap-1">
                    Changes List
                    <span className="bg-slate-800 text-[#64748b] text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                      {unstagedFiles.length}
                    </span>
                  </span>
                  <button 
                    onClick={stageAllFiles} 
                    className="text-[10px] text-blue-400 hover:underline font-mono"
                  >
                    Stage All
                  </button>
                </div>

                <div className="space-y-1">
                  {unstagedFiles.map((f) => (
                    <div 
                      key={f.path}
                      className="group flex items-center justify-between py-1 px-2 hover:bg-[#1f1f2e] stage-item rounded"
                    >
                      <button
                        onClick={() => openFileInTab(f.path)}
                        className="flex items-center gap-1.5 text-xs font-mono text-[#f43f5e] truncate"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span className="truncate">{f.path.split("/").pop()}</span>
                        <span className="text-[9px] uppercase font-mono text-yellow-500 ml-1">M</span>
                      </button>
                      <button
                        onClick={() => stageFile(f.path, true)}
                        title="Stage changes"
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-750 text-slate-400 hover:text-emerald-400 rounded"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Commit History */}
            {gitCommitHistory.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800/40">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">
                  Recent commits
                </span>
                <div className="space-y-1.5">
                  {gitCommitHistory.map((commit, idx) => (
                    <div 
                      key={idx}
                      className="flex flex-col gap-0.5 p-2 bg-[#0c0c14] border border-slate-900 rounded font-mono text-[11px]"
                    >
                      <div className="text-slate-200 truncate">{commit}</div>
                      <div className="text-slate-500 text-[10px] flex items-center gap-1.5 justify-between">
                        <span>7db61a {idx === 0 ? "(HEAD -> main)" : ""}</span>
                        <span>just now</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
