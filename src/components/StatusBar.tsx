import React from "react";
import { useVSCodeStore } from "../lib/store";
import { GitFork, ShieldAlert, Bell, CheckSquare, RefreshCw } from "lucide-react";

export function StatusBar() {
  const { 
    activeFilePath, 
    gitModifiedFiles, 
    cursorLine, 
    cursorColumn,
    settings 
  } = useVSCodeStore();

  const modifiedCount = gitModifiedFiles.length;
  // Compute standard dynamic language layout tags from active document
  const getLanguageTag = (path: string | null): string => {
    if (!path) return "No Language";
    const ext = path.split(".").pop();
    switch (ext) {
      case "dart": return "Dart";
      case "yaml": return "YAML";
      case "md": return "Markdown";
      case "ts": return "TypeScript";
      case "tsx": return "React (TSX)";
      case "json": return "JSON";
      default: return "Plain Text";
    }
  };

  return (
    <div 
      id="vscode-status-bar" 
      className="h-[22px] bg-[#0c0d15] text-[#b0b0c0] text-[10.5px] border-t border-slate-900 px-3 flex items-center justify-between shrink-0 select-none z-40 relative font-sans leading-none"
    >
      {/* Left items - alerts counters and branch status */}
      <div className="flex items-center gap-3">
        {/* Dynamic Branch selector badge mimicking VS Code bottom left block */}
        <button className="h-full px-2 py-1.5 hover:bg-slate-800 rounded bg-[#007acc] text-white flex items-center gap-1 transition select-none font-semibold">
          <GitFork className="w-3.5 h-3.5" />
          <span>main</span>
        </button>

        <button className="flex items-center gap-1 text-slate-400 hover:text-slate-100 transition">
          <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: "12s" }} />
          <span>Connecting live...</span>
        </button>

        {modifiedCount > 0 && (
          <div className="flex items-center gap-1 text-red-400 font-medium">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{modifiedCount} edits</span>
          </div>
        )}
      </div>

      {/* Right details - caret line numbers and layouts config details */}
      <div className="flex items-center gap-4">
        {/* Cursor coords Ln & Col */}
        {activeFilePath && (
          <div className="font-mono">
            Ln {cursorLine}, Col {cursorColumn}
          </div>
        )}

        <div className="hover:text-slate-200 cursor-pointer">
          Spaces: {settings.indentSize}
        </div>

        <div className="hover:text-slate-200 cursor-pointer">
          UTF-8
        </div>

        <div className="hover:text-slate-200 cursor-pointer">
          {settings.lineEndings}
        </div>

        <div className="px-1 py-0.5 bg-blue-900/20 text-blue-400 border border-blue-900/30 rounded font-semibold text-[10px] select-none uppercase font-mono">
          {getLanguageTag(activeFilePath)}
        </div>

        <button 
          title="Notification panel"
          className="hover:text-slate-100 transition p-0.5 rounded cursor-pointer flex items-center justify-center"
        >
          <Bell className="w-3.5 h-3.5 text-slate-500 hover:text-blue-400" />
        </button>
      </div>
    </div>
  );
}
