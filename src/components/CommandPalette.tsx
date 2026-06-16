import React, { useRef, useEffect } from "react";
import { useVSCodeStore } from "../lib/store";
import { CommandItem } from "../types";
import { Search, Terminal, Settings, Copy, Shield, File, Bot } from "lucide-react";

export function CommandPalette() {
  const {
    showCommandPalette,
    commandPaletteQuery,
    commandPaletteIndex,
    setCommandPaletteOpen,
    setCommandPaletteQuery,
    setCommandPaletteIndex,
    triggerCommand
  } = useVSCodeStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus automatically when visible
  useEffect(() => {
    if (showCommandPalette) {
      inputRef.current?.focus();
      setCommandPaletteQuery("");
    }
  }, [showCommandPalette]);

  if (!showCommandPalette) return null;

  // List of standard IDE actions
  const commands: CommandItem[] = [
    { id: "toggle_sidebar", name: "View: Toggle Primary Sidebar Collapsed", shortcut: "Ctrl+B", category: "View", action: () => {} },
    { id: "explorer", name: "View: Show Workspace Explorer Panel", shortcut: "Ctrl+Shift+E", category: "View", action: () => {} },
    { id: "search", name: "View: Show Global Search & Replace Panel", shortcut: "Ctrl+Shift+F", category: "View", action: () => {} },
    { id: "git", name: "View: Show Git Source Control Versioning", shortcut: "Ctrl+Shift+G", category: "View", action: () => {} },
    { id: "extensions", name: "View: Show Extensions Installation Marketplace", shortcut: "Ctrl+Shift+X", category: "View", action: () => {} },
    { id: "ai", name: "View: Show VS Copilot AI Chat Assistant", shortcut: "Ctrl+Shift+I", category: "View", action: () => {} },
    { id: "close_all_tabs", name: "Editor: Close All Tabs Open in Editor Workspace", shortcut: "Ctrl+K W", category: "Editor", action: () => {} },
    { id: "save_file", name: "File: Save Current Buffer", shortcut: "Ctrl+S", category: "File", action: () => {} },
    { id: "create_file_root", name: "File: Create New Script File in root directory", shortcut: "Ctrl+N", category: "File", action: () => {} },
    { id: "download_project", name: "File: Download Workspace Project (ZIP)", shortcut: "Ctrl+Shift+D", category: "File", action: () => {} },
    { id: "run_project", name: "Debug: Compile & Run Project (Simulate Flutter Run)", shortcut: "F5", category: "Debug", action: () => {} },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(commandPaletteQuery.toLowerCase()) ||
    cmd.category.toLowerCase().includes(commandPaletteQuery.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setCommandPaletteOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCommandPaletteIndex(Math.min(commandPaletteIndex + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCommandPaletteIndex(Math.max(commandPaletteIndex - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0 && filtered[commandPaletteIndex]) {
        triggerCommand(filtered[commandPaletteIndex].id);
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-[#000000]/65 flex justify-center pt-[70px] z-55 select-none font-sans"
      onClick={() => setCommandPaletteOpen(false)}
    >
      {/* Floating card palette panel */}
      <div 
        className="w-full max-w-[540px] bg-[#161622] rounded-lg border border-slate-800 shadow-2xl overflow-hidden h-[330px] flex flex-col transition-transform animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input line */}
        <div className="flex items-center gap-2 px-3.5 py-3 border-b border-slate-850 bg-[#12121d] relative">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={commandPaletteQuery}
            onChange={(e) => setCommandPaletteQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type command name to execute or route..."
            className="w-full bg-transparent text-xs text-white focus:outline-none font-mono"
          />
          <span className="text-[10px] text-slate-500 bg-[#0c0c14] border border-slate-850 px-1.5 py-0.5 rounded font-mono select-none">
            {filtered.length} matches
          </span>
        </div>

        {/* Scrollable actions list */}
        <div className="flex-1 overflow-y-auto py-1.5 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="text-center text-slate-500 text-xs py-8 font-mono select-none">
              No matching commands or actions found. Try typing 'View' or 'File'.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isActive = idx === commandPaletteIndex;

              return (
                <button
                  key={cmd.id}
                  onClick={() => triggerCommand(cmd.id)}
                  className={`w-full text-left px-4 py-2 flex items-center justify-between font-mono text-xs select-none ${
                    isActive 
                      ? "bg-blue-600 text-white font-semibold" 
                      : "text-slate-350 hover:bg-[#1c1c2e] hover:text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {cmd.category === "File" && <File className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    {cmd.category === "View" && <Settings className="w-3.5 h-3.5 text-violet-500 shrink-0" />}
                    {cmd.category === "Debug" && <Bot className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                    
                    <span className="truncate">{cmd.name}</span>
                  </div>

                  {cmd.shortcut && (
                    <span className={`text-[10px] uppercase shrink-0 font-mono ${
                      isActive ? "text-slate-200 bg-blue-700" : "text-slate-550"
                    }`}>
                      {cmd.shortcut}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
