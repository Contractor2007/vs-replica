import React, { useState } from "react";
import { useVSCodeStore } from "../../lib/store";
import { VSCodeFile } from "../../types";
import { 
  Folder, 
  FolderOpen, 
  File, 
  Plus, 
  FolderPlus, 
  FolderMinus,
  Trash2, 
  Edit3, 
  ChevronRight, 
  ChevronDown 
} from "lucide-react";

export function ExplorerPanel() {
  const { 
    files, 
    activeFilePath, 
    openFileInTab, 
    createNewFile, 
    createNewFolder, 
    deletePath, 
    renamePath, 
    expandFolder 
  } = useVSCodeStore();

  const [inputState, setInputState] = useState<{
    visible: boolean;
    type: "file" | "folder";
    parentPath: string | null;
  }>({ visible: false, type: "file", parentPath: null });

  const [renameState, setRenameState] = useState<{
    path: string | null;
    currentValue: string;
  }>({ path: null, currentValue: "" });

  const [newValue, setNewValue] = useState("");

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    if (inputState.type === "file") {
      createNewFile(inputState.parentPath, newValue.trim());
    } else {
      createNewFolder(inputState.parentPath, newValue.trim());
    }

    setInputState({ visible: false, type: "file", parentPath: null });
    setNewValue("");
  };

  const handleRenameSubmit = (e: React.FormEvent, oldPath: string) => {
    e.preventDefault();
    if (!renameState.currentValue.trim()) return;

    renamePath(oldPath, renameState.currentValue.trim());
    setRenameState({ path: null, currentValue: "" });
  };

  // Nested Recursive Renderer Component
  const renderTree = (nodes: VSCodeFile[], depth = 0) => {
    return nodes.map((node) => {
      const isFolder = node.type === "folder";
      const isSelected = activeFilePath === node.path;
      const isExpanded = node.isExpanded;

      return (
        <div key={node.path} className="flex flex-col select-none">
          {/* Node heading row */}
          {renameState.path === node.path ? (
            <form 
              onSubmit={(e) => handleRenameSubmit(e, node.path)}
              className="flex items-center gap-1.5 w-full py-0.5 px-2 bg-slate-900 border border-slate-700 rounded"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {isFolder ? <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" /> : <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              <input
                autoFocus
                type="text"
                value={renameState.currentValue}
                onChange={(e) => setRenameState({ ...renameState, currentValue: e.target.value })}
                onBlur={() => setRenameState({ path: null, currentValue: "" })}
                className="bg-transparent border-none text-xs text-white focus:outline-none w-full p-0 font-mono"
              />
            </form>
          ) : (
            <div
              className={`flex items-center justify-between group py-1.5 px-3 cursor-pointer transition-colors duration-100 font-mono text-xs ${
                isSelected 
                  ? "bg-slate-800/60 text-white font-medium border-l-2 border-blue-500" 
                  : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
              }`}
              style={{ paddingLeft: `${depth * 12 + 12}px` }}
              onClick={() => {
                if (isFolder) {
                  expandFolder(node.path);
                } else {
                  openFileInTab(node.path);
                }
              }}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {isFolder ? (
                  <>
                    <span className="text-slate-500 shrink-0">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                    {isExpanded ? (
                      <FolderOpen className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    )}
                  </>
                ) : (
                  <>
                    <span className="w-3.5 shrink-0" />
                    <File className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </>
                )}
                <span className="truncate leading-none">{node.name}</span>
              </div>

              {/* Hover dynamic action buttons inside tree node */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 shrink-0 pl-1.5 bg-transparent">
                {isFolder && (
                  <>
                    <button
                      title="New File"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInputState({ visible: true, type: "file", parentPath: node.path });
                        expandFolder(node.path, true);
                      }}
                      className="p-0.5 hover:bg-slate-750 text-slate-400 hover:text-white rounded"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      title="New Folder"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInputState({ visible: true, type: "folder", parentPath: node.path });
                        expandFolder(node.path, true);
                      }}
                      className="p-0.5 hover:bg-slate-750 text-slate-400 hover:text-white rounded"
                    >
                      <FolderPlus className="w-3 h-3" />
                    </button>
                  </>
                )}
                <button
                  title="Rename"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameState({ path: node.path, currentValue: node.name });
                  }}
                  className="p-0.5 hover:bg-slate-750 text-slate-400 hover:text-white rounded"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                {isFolder ? (
                  <button
                    title="Remove Folder from Workspace"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to remove folder "${node.name}" from the active workspace?`)) {
                        deletePath(node.path);
                      }
                    }}
                    className="p-0.5 hover:bg-amber-900/40 text-slate-400 hover:text-amber-400 rounded"
                  >
                    <FolderMinus className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    title="Delete File"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete file "${node.name}" permanently?`)) {
                        deletePath(node.path);
                      }
                    }}
                    className="p-0.5 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Children block */}
          {isFolder && isExpanded && node.children && (
            <div className="flex flex-col">
              {renderTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div id="vscode-explorer-panel" className="h-full flex flex-col min-h-0 bg-[#161622] text-slate-300">
      {/* Root actions header */}
      <div className="px-4 py-2 bg-[#12121d] flex items-center justify-between border-b border-slate-800/50">
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748b] font-mono select-none">
          Explorer: Workspace
        </span>
        <div className="flex items-center gap-1.5">
          <button
            title="Create File in Root"
            onClick={() => setInputState({ visible: true, type: "file", parentPath: null })}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            title="Create Folder in Root"
            onClick={() => setInputState({ visible: true, type: "folder", parentPath: null })}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Adding Input Modal state */}
      {inputState.visible && (
        <form 
          onSubmit={handleCreateSubmit}
          className="mx-4 my-2.5 p-2 bg-[#0c0c14] border border-slate-800 rounded flex flex-col gap-1.5 focus-within:border-blue-500 shadow-xl transition-all"
        >
          <span className="text-[9px] font-bold text-blue-400 uppercase font-mono">
            New {inputState.type} {inputState.parentPath ? `under ${inputState.parentPath.split("/").pop()}` : "in Root"}
          </span>
          <div className="flex items-center gap-1">
            <input
              autoFocus
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={`name.${inputState.type === "file" ? "dart" : "folder"}`}
              className="bg-transparent text-xs text-white p-1 focus:outline-none w-full font-mono font-medium"
              onKeyDown={(e) => {
                if (e.key === "Escape") setInputState({ visible: false, type: "file", parentPath: null });
              }}
            />
          </div>
        </form>
      )}

      {/* Main hierarchical list tree */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {files.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-500 text-xs font-mono">
            Empty workspace. Create some files to get started!
          </div>
        ) : (
          renderTree(files)
        )}
      </div>
    </div>
  );
}
