import React, { useState } from "react";
import { useVSCodeStore } from "../lib/store";
import { Search, Spline, LayoutGrid, Terminal, HelpCircle, X, Minus, Square, FolderDown } from "lucide-react";

export function TitleBar() {
  const { activeFilePath, setCommandPaletteOpen, settings, triggerCommand } = useVSCodeStore();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menus = ["File", "Edit", "Selection", "View", "Go", "Run", "Help"];

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  return (
    <div 
      id="vscode-title-bar" 
      className="h-10 bg-[#181824] border-b border-slate-800 flex items-center justify-between px-3 shrink-0 select-none text-xs font-sans text-slate-300 relative z-40"
    >
      {/* Left section: App Icon & Responsive Menu list */}
      <div className="flex items-center gap-3">
        {/* VS Code styled App logo */}
        <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center text-[10px] text-white font-semibold shadow">
          V
        </div>

        {/* Text menu options */}
        <div className="hidden md:flex items-center gap-1.5">
          {menus.map((menu) => (
            <div key={menu} className="relative">
              <button
                onClick={() => handleMenuClick(menu)}
                onMouseEnter={() => activeMenu && setActiveMenu(menu)}
                className={`px-2.5 py-1.5 rounded transition ${
                  activeMenu === menu 
                    ? "bg-slate-800 text-white" 
                    : "hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                {menu}
              </button>
              
              {activeMenu === menu && (
                <div 
                  className="absolute left-0 top-full mt-0.5 w-48 bg-[#1e1e2eff] border border-slate-800 rounded-md shadow-2xl py-1 z-50 text-slate-300"
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <button 
                    onClick={() => { setCommandPaletteOpen(true); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-all flex justify-between"
                  >
                    <span>Command Palette...</span>
                    <span className="text-[10px] text-slate-500">Ctrl+Shift+P</span>
                  </button>
                  <div className="border-t border-slate-800 my-1"></div>
                  <button 
                    onClick={() => { setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-all flex justify-between"
                  >
                    <span>New Text File</span>
                    <span className="text-[10px] text-slate-500">Ctrl+N</span>
                  </button>
                  <button 
                    onClick={() => { setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-all flex justify-between"
                  >
                    <span>Open Folder...</span>
                    <span className="text-[10px] text-slate-500">Ctrl+O</span>
                  </button>
                  <div className="border-t border-slate-800 my-1"></div>
                  <button 
                    onClick={() => { triggerCommand("download_project"); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5 font-medium">Download Project ZIP</span>
                    <span className="text-[10px] text-emerald-500">Ctrl+Shift+D</span>
                  </button>
                  <div className="border-t border-slate-800 my-1"></div>
                  <button 
                    onClick={() => { window.location.reload(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <span>Reload Window</span>
                  </button>
                  <button 
                    onClick={() => { setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <span>Exit Simulator</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Center section: Global Command Bar Selector */}
      <div className="flex-1 max-w-md mx-6">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full bg-[#0c0c14] border border-slate-800/80 hover:border-slate-700/80 text-slate-400 hover:text-slate-200 px-3 py-1 rounded flex items-center justify-between transition group shadow-inner"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            <span className="truncate text-[11px] font-mono">
              vscode-simulator - {activeFilePath || "No active document"}
            </span>
          </div>
          <span className="text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded font-mono font-normal">
            Ctrl+P
          </span>
        </button>
      </div>

      {/* Right section: Window Controls */}
      <div className="flex items-center gap-1">
        {/* Download Project Toolbar Button */}
        <button
          onClick={() => triggerCommand("download_project")}
          id="btn-download-project-toolbar"
          title="Download entire workspace file tree as a packaging ZIP file (Ctrl+Shift+D)"
          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium rounded shadow-sm hover:shadow transition-all mr-2 text-[11px] cursor-pointer"
        >
          <FolderDown className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline font-bold">Download Project</span>
        </button>

        {/* Active Theme Chip badge */}
        <span className="hidden sm:inline-block text-[10px] uppercase font-mono font-bold tracking-wider text-blue-400 bg-blue-900/15 border border-blue-800/20 px-2 py-0.5 rounded-full mr-3">
          {settings.theme}
        </span>

        <button className="p-1 px-2.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition">
          <Minus className="w-3 h-3" />
        </button>
        <button className="p-1 px-2.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition">
          <Square className="w-2.5 h-2.5" />
        </button>
        <button className="p-1 px-2.5 hover:bg-red-650 text-slate-400 hover:text-white rounded transition">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
