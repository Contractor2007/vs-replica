import React, { useRef, useCallback } from "react";
import { useVSCodeStore } from "../lib/store";
import { ExplorerPanel } from "./panels/ExplorerPanel";
import { SearchPanel } from "./panels/SearchPanel";
import { GitPanel } from "./panels/GitPanel";
import { ExtensionsPanel } from "./panels/ExtensionsPanel";
import { Bot, LogIn } from "lucide-react";
import { AIChatPanel } from "./AIChatPanel";
import { SupabasePanel } from "./panels/SupabasePanel";

export function LeftSidebar() {
  const { 
    activeSidebarTab, 
    leftSidebarWidth, 
    sidebarCollapsed, 
    setLeftSidebarWidth,
    toggleSidebar
  } = useVSCodeStore();

  const resizeRef = useRef<HTMLDivElement>(null);

  const startDragging = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftSidebarWidth;

    const doDrag = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setLeftSidebarWidth(startWidth + deltaX);
    };

    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  }, [leftSidebarWidth, setLeftSidebarWidth]);

  if (sidebarCollapsed || !activeSidebarTab) {
    return null;
  }

  return (
    <div 
      id="vscode-left-sidebar" 
      ref={resizeRef}
      className="flex h-full select-none shrink-0 relative bg-[#161622] border-r border-slate-850"
      style={{ width: `${leftSidebarWidth}px` }}
    >
      {/* Dynamic Content Panel select Router */}
      <div className="flex-1 h-full min-h-0 flex flex-col overflow-hidden">
        {activeSidebarTab === "explorer" && <ExplorerPanel />}
        {activeSidebarTab === "search" && <SearchPanel />}
        {activeSidebarTab === "git" && <GitPanel />}
        {activeSidebarTab === "extensions" && <ExtensionsPanel />}
        {activeSidebarTab === "supabase" && <SupabasePanel />}
      </div>

      {/* resizable drag trigger divider */}
      <div
        onMouseDown={startDragging}
        className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-600/65 active:bg-blue-600 transition-all z-45"
        title="Drag to resize panel"
      />
    </div>
  );
}
