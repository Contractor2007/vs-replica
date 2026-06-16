import React, { useEffect, useCallback } from "react";
import { useVSCodeStore } from "./lib/store";
import { TitleBar } from "./components/TitleBar";
import { ActivityBar } from "./components/ActivityBar";
import { LeftSidebar } from "./components/LeftSidebar";
import { EditorArea } from "./components/EditorArea";
import { RightSidebar } from "./components/RightSidebar";
import { StatusBar } from "./components/StatusBar";
import { CommandPalette } from "./components/CommandPalette";
import { ContextMenu } from "./components/ContextMenu";

export default function App() {
  const {
    showCommandPalette,
    setCommandPaletteOpen,
    toggleSidebar,
    saveActiveFile,
    triggerCommand,
    setContextMenu
  } = useVSCodeStore();

  // Handle global shortcuts listener
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 1. Toggle Command Palette with Ctrl+P or Ctrl+Shift+P
    if ((e.key === "p" || e.key === "P") && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setCommandPaletteOpen(!showCommandPalette);
    }

    // 2. Toggle Left Sidebar with Ctrl+B
    if ((e.key === "b" || e.key === "B") && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      toggleSidebar();
    }

    // 4. Manual Save file with Ctrl+S
    if ((e.key === "s" || e.key === "S") && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveActiveFile();
    }

    // 5. Download Project with Ctrl+Shift+D
    if ((e.key === "d" || e.key === "D") && (e.ctrlKey || e.metaKey) && e.shiftKey) {
      e.preventDefault();
      triggerCommand("download_project");
    }

    // 6. Build/Run compile with F5
    if (e.key === "F5") {
      e.preventDefault();
      triggerCommand("run_project");
    }
  }, [showCommandPalette, setCommandPaletteOpen, toggleSidebar, saveActiveFile, triggerCommand]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Handle right-click context blocker inside editor area
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true,
      targetType: "editor",
      targetId: "active_element"
    });
  };

  return (
    <div 
      id="vscode-main-window" 
      className="h-screen w-full bg-[#11121d] text-slate-200 flex flex-col font-sans select-none antialiased overflow-hidden text-xs relative"
      onContextMenu={handleContextMenu}
    >
      {/* Absolute floating overlays */}
      <CommandPalette />
      <ContextMenu />

      {/* 1. Header Title range */}
      <TitleBar />

      {/* 2. Main content shelf: Activity strip, Resizable explorer files list, Editor tabs & Minimap */}
      <div className="flex-1 flex min-h-0 relative z-30">
        
        {/* Left vertical select icons bar */}
        <ActivityBar />

        {/* Resizable and collapsible sidebar */}
        <LeftSidebar />

        {/* Center-to-Right dynamic block: Editor and Bottom Console panels */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          
          {/* Main workspace, breadcrumbs, lines, code, minimap */}
          <EditorArea />
        </div>

        {/* Right side AI chat companion panel */}
        <RightSidebar />
      </div>

      {/* 3. Status strip line */}
      <StatusBar />
    </div>
  );
}
