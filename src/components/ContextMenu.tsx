import React, { useEffect, useRef } from "react";
import { useVSCodeStore } from "../lib/store";
import { Copy, Trash, FileEdit, RefreshCcw, Save, X } from "lucide-react";

export function ContextMenu() {
  const { 
    contextMenu, 
    setContextMenu, 
    closeTab, 
    closeOtherTabs, 
    deletePath, 
    saveActiveFile,
    triggerCommand
  } = useVSCodeStore();

  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside gestures
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (contextMenu && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [contextMenu]);

  if (!contextMenu || !contextMenu.visible) return null;

  const handleAction = (type: string) => {
    setContextMenu(null);
    const { targetId } = contextMenu;

    switch (type) {
      case "close":
        closeTab(targetId);
        break;
      case "close_others":
        closeOtherTabs(targetId);
        break;
      case "delete":
        if (confirm(`Are you sure you want to delete ${targetId}?`)) {
          deletePath(targetId);
        }
        break;
      case "save":
        saveActiveFile();
        break;
      case "run":
        triggerCommand("run_project");
        break;
      default:
        console.warn(`Sub-action ${type} completed successfully`);
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-[#181824] border border-slate-800 rounded shadow-2xl py-1 z-55 w-48 text-[11px] font-sans text-slate-300 font-medium select-none"
      style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
    >
      {contextMenu.targetType === "tab" && (
        <>
          <button
            onClick={() => handleAction("close")}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
          >
            <X className="w-3.5 h-3.5 text-slate-500" />
            Close Tab
          </button>
          <button
            onClick={() => handleAction("close_others")}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            Close Other Tabs
          </button>
          <div className="border-t border-slate-800 my-1"></div>
          <button
            onClick={() => handleAction("save")}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            Save File Buffer
          </button>
        </>
      )}

      {contextMenu.targetType === "file" && (
        <>
          <button
            onClick={() => handleAction("delete")}
            className="w-full text-left px-3 py-1.5 hover:bg-red-650 hover:text-white text-rose-400 flex items-center gap-2"
          >
            <Trash className="w-3.5 h-3.5" />
            Delete File Permanently
          </button>
        </>
      )}

      {contextMenu.targetType === "editor" && (
        <>
          <button
            onClick={() => handleAction("save")}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            Save Buffer (Ctrl+S)
          </button>
          <button
            onClick={() => handleAction("run")}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
          >
            <RefreshCcw className="w-3.5 h-3.5 text-slate-500 animate-spin" />
            Compile & Run Project
          </button>
        </>
      )}
    </div>
  );
}
