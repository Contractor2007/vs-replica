import React from "react";
import { useVSCodeStore } from "../lib/store";
import { 
  Folder, 
  Search, 
  GitFork, 
  Play, 
  Puzzle, 
  Bot, 
  Settings, 
  UserRound,
  Info
} from "lucide-react";

export function ActivityBar() {
  const { 
    activeSidebarTab, 
    setSidebarTab, 
    gitModifiedFiles, 
    chatMessages,
    sidebarCollapsed,
    rightSidebarCollapsed,
    setRightSidebarCollapsed
  } = useVSCodeStore();

  const primaryItems = [
    { id: "explorer" as const, icon: Folder, label: "Explorer", badge: 0 },
    { id: "search" as const, icon: Search, label: "Search", badge: 0 },
    { 
      id: "git" as const, 
      icon: GitFork, 
      label: "Source Control", 
      badge: gitModifiedFiles.length 
    },
    { id: "extensions" as const, icon: Puzzle, label: "Extensions", badge: 0 },
    { 
      id: "ai" as const, 
      icon: Bot, 
      label: "AI Chat Assistant", 
      badge: chatMessages.length > 1 ? chatMessages.length - 1 : 0 
    }
  ];

  return (
    <div 
      id="vscode-activity-bar" 
      className="w-12 bg-[#0c0f1a] border-r border-slate-850 flex flex-col justify-between items-center py-2 shrink-0 select-none z-35 relative"
    >
      {/* Top action tabs list */}
      <div className="flex flex-col gap-1 w-full items-center">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isAI = item.id === "ai";
          const isActive = isAI 
            ? !rightSidebarCollapsed 
            : activeSidebarTab === item.id && !sidebarCollapsed;

          const handleTabClick = () => {
            if (isAI) {
              setRightSidebarCollapsed(!rightSidebarCollapsed);
            } else {
              setSidebarTab(item.id);
            }
          };

          return (
            <button
              key={item.id}
              onClick={handleTabClick}
              title={item.label}
              className={`h-11 w-full flex items-center justify-center relative group transition-colors duration-150 ${
                isActive ? "text-blue-400" : "text-slate-500 hover:text-slate-200"
              }`}
            >
              {/* Left active line notch marker */}
              {isActive && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-[2.5px] bg-blue-500 rounded-r-sm" />
              )}

              <Icon className={`w-5 h-5 transition-transform duration-150 group-hover:scale-105 ${isActive ? "scale-105" : ""}`} />

              {/* Dynamic notification badge bubbles */}
              {item.badge > 0 && (
                <span className="absolute bottom-1 right-1 bg-blue-600 border border-[#0c0f1a] text-white text-[9px] leading-none font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1 font-mono">
                  {item.badge}
                </span>
              )}

              {/* Hover label tooltip */}
              <div className="absolute left-full ml-1 px-2 py-1 bg-slate-900 border border-slate-800 text-slate-100 text-[10px] font-sans font-medium rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl">
                {item.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom control tabs */}
      <div className="flex flex-col gap-1 w-full items-center">
        <button 
          onClick={() => setSidebarTab("supabase")}
          title="Account profile & Saved Projects"
          className={`h-11 w-full flex items-center justify-center transition relative group ${
            activeSidebarTab === "supabase" && !sidebarCollapsed ? "text-blue-400" : "text-slate-500 hover:text-slate-200"
          }`}
        >
          {activeSidebarTab === "supabase" && !sidebarCollapsed && (
            <div className="absolute left-0 top-1/4 bottom-1/4 w-[2.5px] bg-blue-500 rounded-r-sm" />
          )}
          <UserRound className="w-4.5 h-4.5" />
          <div className="absolute left-full ml-1 px-2 py-1 bg-slate-900 border border-slate-800 text-slate-100 text-[10px] font-sans rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl">
            SaaS Account & Database
          </div>
        </button>

        <button 
          onClick={() => setSidebarTab("explorer")}
          title="Settings menu"
          className="h-11 w-full flex items-center justify-center text-slate-500 hover:text-slate-200 group transition relative"
        >
          <Settings className="w-4.5 h-4.5" />
          <div className="absolute left-full ml-1 px-2 py-1 bg-slate-900 border border-slate-800 text-slate-100 text-[10px] font-sans rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl">
            Workspace Settings (Ctrl+,)
          </div>
        </button>
      </div>
    </div>
  );
}
