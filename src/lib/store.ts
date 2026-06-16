import { create } from "zustand";
import { 
  VSCodeFile, 
  TabItem, 
  ChatMessage, 
  SearchMatch, 
  ExtensionItem, 
  GitStatusItem, 
  EditorSettings 
} from "../types";

// Seed data: High-fidelity Dart/Flutter files described in the user request
const initialFiles: VSCodeFile[] = [];

// Helper to recursively insert or update files/folders in nested tree
const upsertFileInTree = (nodes: VSCodeFile[], filePath: string, content: string): VSCodeFile[] => {
  const parts = filePath.split('/');
  
  const recurse = (currentNodes: VSCodeFile[], index: number): VSCodeFile[] => {
    if (index >= parts.length) return currentNodes;
    
    const name = parts[index];
    const isLast = index === parts.length - 1;
    const currentPath = parts.slice(0, index + 1).join('/');
    
    if (isLast) {
      let found = false;
      const nextNodes = currentNodes.map(node => {
        if (node.path === filePath && node.type === "file") {
          found = true;
          return { ...node, content };
        }
        return node;
      });
      if (!found) {
        nextNodes.push({
          name,
          path: filePath,
          content,
          type: "file"
        });
      }
      return nextNodes;
    } else {
      let folderIdx = currentNodes.findIndex(node => node.path === currentPath && node.type === "folder");
      if (folderIdx === -1) {
        const newFolder: VSCodeFile = {
          name,
          path: currentPath,
          type: "folder",
          children: [],
          isExpanded: true
        };
        const nextNodes = [...currentNodes, newFolder];
        folderIdx = nextNodes.length - 1;
        const kids = recurse(nextNodes[folderIdx].children || [], index + 1);
        nextNodes[folderIdx] = { ...nextNodes[folderIdx], children: kids };
        return nextNodes;
      } else {
        const nextNodes = [...currentNodes];
        const existingFolder = nextNodes[folderIdx];
        const kids = recurse(existingFolder.children || [], index + 1);
        nextNodes[folderIdx] = { ...existingFolder, children: kids, isExpanded: true };
        return nextNodes;
      }
    }
  };

  return recurse(nodes, 0);
};

// Helper to recursively delete file/folders in nested tree
const deletePathFromTree = (nodes: VSCodeFile[], targetPath: string): VSCodeFile[] => {
  return nodes.filter(node => node.path !== targetPath).map(node => {
    if (node.type === "folder" && node.children) {
      return {
        ...node,
        children: deletePathFromTree(node.children, targetPath)
      };
    }
    return node;
  });
};

export const dummySeedFiles: VSCodeFile[] = [
  {
    name: "lib",
    path: "lib",
    type: "folder",
    isExpanded: true,
    children: [
      {
        name: "models",
        path: "lib/models",
        type: "folder",
        isExpanded: true,
        children: [
          {
            name: "editor_state.dart",
            path: "lib/models/editor_state.dart",
            type: "file",
            content: `import 'package:flutter/material.dart';

class EditorState extends ChangeNotifier {
  String _activePath = "lib/main.dart";
  List<String> _openTabs = ["lib/main.dart", "pubspec.yaml"];
  bool _sidebarCollapsed = false;
  double _bottomPanelHeight = 220.0;
  
  String get activePath => _activePath;
  List<String> get openTabs => _openTabs;
  bool get sidebarCollapsed => _sidebarCollapsed;
  double get bottomPanelHeight => _bottomPanelHeight;

  void setActiveFile(String path) {
    _activePath = path;
    if (!_openTabs.contains(path)) {
      _openTabs.add(path);
    }
    notifyListeners();
  }

  void closeTab(String path) {
    _openTabs.remove(path);
    if (_activePath == path && _openTabs.isNotEmpty) {
      _activePath = _openTabs.last;
    }
    notifyListeners();
  }

  void toggleSidebar() {
    _sidebarCollapsed = !_sidebarCollapsed;
    notifyListeners();
  }

  void setBottomHeight(double h) {
    _bottomPanelHeight = h;
    notifyListeners();
  }
}`
          }
        ]
      },
      {
        name: "theme",
        path: "lib/theme",
        type: "folder",
        children: [
          {
            name: "vscode_theme.dart",
            path: "lib/theme/vscode_theme.dart",
            type: "file",
            content: `import 'package:flutter/material.dart';

class VSCodeTheme {
  static const Color background = Color(0xFF1E1E1E);
  static const Color sidebar = Color(0xFF252526);
  static const Color activityBar = Color(0xFF333333);
  static const Color statusBar = Color(0xFF007ACC);
  static const Color accentBlue = Color(0xFF007ACC);
  
  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: statusBar,
      scaffoldBackgroundColor: background,
      fontFamily: 'Courier',
      textTheme: const TextTheme(
        bodyMedium: TextStyle(color: Colors.white, fontSize: 13.0, fontFamily: 'monospace'),
      ),
    );
  }
}`
          }
        ]
      },
      {
        name: "widgets",
        path: "lib/widgets",
        type: "folder",
        children: [
          {
            name: "editor",
            path: "lib/widgets/editor",
            type: "folder",
            children: [
              {
                name: "code_editor.dart",
                path: "lib/widgets/editor/code_editor.dart",
                type: "file",
                content: `import 'package:flutter/material.dart';

class CodeEditor extends StatelessWidget {
  final String text;
  final Function(String) onChanged;

  const CodeEditor({
    Key? key,
    required this.text,
    required this.onChanged,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF1E1E1E),
      padding: const EdgeInsets.all(8.0),
      child: TextField(
        controller: TextEditingController(text: text),
        maxLines: null,
        style: const TextStyle(
          color: Colors.white70,
          fontFamily: 'monospace',
          fontSize: 14.0,
        ),
        decoration: InputDecoration.collapsed(hintText: ""),
        onChanged: onChanged,
      ),
    );
  }
}`
              }
            ]
          }
        ]
      },
      {
        name: "main.dart",
        path: "lib/main.dart",
        type: "file",
        content: `import 'package:flutter/material.dart';
import 'theme/vscode_theme.dart';
import 'models/editor_state.dart';

void main() {
  runApp(const VSCodeSimulatorApp());
}

class VSCodeSimulatorApp extends StatelessWidget {
  const VSCodeSimulatorApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VS Code Code Editor Clone',
      theme: VSCodeTheme.darkTheme,
      home: const VSCodeWorkspaceScreen(),
    );
  }
}

class VSCodeWorkspaceScreen extends StatefulWidget {
  const VSCodeWorkspaceScreen({Key? key}) : super(key: key);

  @override
  _VSCodeWorkspaceScreenState createState() => _VSCodeWorkspaceScreenState();
}

class _VSCodeWorkspaceScreenState extends State<VSCodeWorkspaceScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Text('Initializing VS Code clone IDE... Ready!'),
      ),
    );
  }
}`
      }
    ]
  },
  {
    name: "pubspec.yaml",
    path: "pubspec.yaml",
    type: "file",
    content: `name: vscode_code_editor_flutter
description: VS Code clone built with Flutter.
version: 1.0.0+1

environment:
  sdk: ">=2.17.0 <3.0.0"

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^2.0.0

flutter:
  uses-material-design: true`
  },
  {
    name: "README.md",
    path: "README.md",
    type: "file",
    content: `# VS Code Flutter Simulator

A premium visual and functional replication of Visual Studio Code. This lightweight IDE offers:
- Realistic file tree navigation (create, delete, expand folders).
- Multi-tabs editor manager with automatic state retention.
- Double-resize bounds.
- Git Staging area tracking and dynamic revision monitoring.
- Context command palette launcher (Ctrl+Shift+P).
- Live AI Chat Panel proxying Gemini content directly.

Enjoy compiling this codebase with mock commands! Try \`flutter run\` in the console.`
  }
];

const initialExtensions: ExtensionItem[] = [
  {
    id: "flutter",
    name: "Flutter",
    description: "Flutter support and utility tools.",
    author: "Dart Code",
    version: "v3.74.0",
    downloads: "5.4M",
    rating: 4.8,
    installed: true,
    category: "Language"
  },
  {
    id: "dart",
    name: "Dart",
    description: "Language support for Dart and code formatting.",
    author: "Dart Code",
    version: "v3.74.0",
    downloads: "6.1M",
    rating: 4.9,
    installed: true,
    category: "Language"
  },
  {
    id: "gitlens",
    name: "GitLens — Git supercharged",
    description: "Visualize code authorship and history at a glance.",
    author: "GitKraken",
    version: "v14.1.0",
    downloads: "28M",
    rating: 4.6,
    installed: false,
    category: "Tool"
  },
  {
    id: "eslint",
    name: "ESLint",
    description: "Integrates ESLint into VS Code.",
    author: "Microsoft",
    version: "v2.4.2",
    downloads: "42M",
    rating: 4.5,
    installed: false,
    category: "Linter"
  },
  {
    id: "prettier",
    name: "Prettier - Code formatter",
    description: "Opinionated code formatter for Javascript/CSS/TypeScript.",
    author: "Prettier",
    version: "v10.1.0",
    downloads: "39M",
    rating: 4.7,
    installed: false,
    category: "Tool"
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    description: "AI-pair programmer suggestion assistance.",
    author: "GitHub",
    version: "v1.120.0",
    downloads: "12M",
    rating: 4.4,
    installed: false,
    category: "Theme"
  }
];

interface VSCodeStore {
  // Files System State
  files: VSCodeFile[];
  openTabs: TabItem[];
  activeFilePath: string | null;
  lastClosedTabs: string[];
  
  // Layout Management State
  activeSidebarTab: "explorer" | "search" | "git" | "extensions" | "ai" | null;
  prevActiveSidebarTab: "explorer" | "search" | "git" | "extensions" | "ai";
  leftSidebarWidth: number;
  sidebarCollapsed: boolean;
  bottomPanelHeight: number;
  bottomPanelCollapsed: boolean;
  activeBottomTab: "problems" | "output" | "debugConsole";
  cursorLine: number;
  cursorColumn: number;

  // Search and Git States
  searchQuery: string;
  searchCaseSensitive: boolean;
  searchWholeWord: boolean;
  searchRegex: boolean;
  searchMatches: SearchMatch[];
  gitModifiedFiles: GitStatusItem[];
  gitCommitMessage: string;
  gitCommitHistory: string[];

  // Extensions
  extensions: ExtensionItem[];
  extensionSearch: string;

  // AI Chat Assistant
  chatMessages: ChatMessage[];
  chatTyping: boolean;

  // Overlays (Command Palette and Context Menus)
  showCommandPalette: boolean;
  commandPaletteQuery: string;
  commandPaletteIndex: number;
  contextMenu: { x: number; y: number; visible: boolean; targetType: "tab" | "file" | "editor"; targetId: string } | null;

  // Terminal simulated console outputs
  terminalInput: string;
  terminalHistory: string[];
  terminalBuffer: { text: string; type: "input" | "info" | "success" | "error" | "normal" }[];

  // Settings
  settings: EditorSettings;

  // Global Actions
  toggleSidebar: () => void;
  setSidebarTab: (tab: "explorer" | "search" | "git" | "extensions" | "ai" | null) => void;
  setLeftSidebarWidth: (w: number) => void;
  setBottomPanelHeight: (h: number) => void;
  setBottomPanelCollapsed: (b: boolean) => void;
  setBottomTab: (tab: "problems" | "output" | "debugConsole") => void;
  setCursorPos: (line: number, col: number) => void;

  // Files operations
  expandFolder: (path: string, expand?: boolean) => void;
  openFileInTab: (path: string) => void;
  closeTab: (path: string) => void;
  closeOtherTabs: (path: string) => void;
  closeAllTabs: () => void;
  updateFileContent: (path: string, newContent: string) => void;
  saveActiveFile: () => void;
  createNewFile: (parentPath: string | null, name: string) => void;
  createNewFolder: (parentPath: string | null, name: string) => void;
  renamePath: (oldPath: string, newName: string) => void;
  deletePath: (path: string) => void;

  // Search Engine
  setSearchQuery: (query: string) => void;
  toggleSearchCase: () => void;
  toggleSearchWholeWord: () => void;
  toggleSearchRegex: () => void;
  performSearch: () => void;

  // Git Simulator
  stageFile: (path: string, stage: boolean) => void;
  stageAllFiles: () => void;
  unstageAllFiles: () => void;
  commitChanges: () => void;
  setGitMessage: (msg: string) => void;

  // Extensions
  toggleExtensionInstall: (id: string) => void;
  setExtensionSearch: (query: string) => void;

  // AI Assistant trigger with real Gemini fetch API
  sendChatMessage: (msg: string) => Promise<void>;
  clearChat: () => void;

  // Command Palette
  setCommandPaletteOpen: (open: boolean) => void;
  setCommandPaletteQuery: (q: string) => void;
  setCommandPaletteIndex: (idx: number) => void;
  triggerCommand: (id: string) => void;

  // Context Menu
  setContextMenu: (menu: { x: number; y: number; visible: boolean; targetType: "tab" | "file" | "editor"; targetId: string } | null) => void;

  // Terminal Runner
  setTerminalInput: (input: string) => void;
  runTerminalCommand: () => void;
  clearTerminal: () => void;

  // Settings Toggles
  updateSettings: (update: Partial<EditorSettings>) => void;
}

export const useVSCodeStore = create<VSCodeStore>((set, get) => {
  // Helper to search deep in file structure
  const findFileByPath = (nodes: VSCodeFile[], path: string): VSCodeFile | null => {
    for (const node of nodes) {
      if (node.path === path) return node;
      if (node.type === "folder" && node.children) {
        const found = findFileByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper to update deep in file structure
  const updateFileTreeInNodes = (nodes: VSCodeFile[], path: string, update: Partial<VSCodeFile>): VSCodeFile[] => {
    return nodes.map((node) => {
      if (node.path === path) {
        return { ...node, ...update };
      }
      if (node.type === "folder" && node.children) {
        return {
          ...node,
          children: updateFileTreeInNodes(node.children, path, update)
        };
      }
      return node;
    });
  };

  // Helper to add deep inside dynamic parents
  const addNewNodeInTree = (nodes: VSCodeFile[], parentPath: string | null, newNode: VSCodeFile): VSCodeFile[] => {
    if (!parentPath) {
      return [...nodes, newNode];
    }
    return nodes.map((node) => {
      if (node.path === parentPath && node.type === "folder") {
        return {
          ...node,
          isExpanded: true,
          children: [...(node.children || []), newNode]
        };
      }
      if (node.type === "folder" && node.children) {
        return {
          ...node,
          children: addNewNodeInTree(node.children, parentPath, newNode)
        };
      }
      return node;
    });
  };

  // Helper to delete deep in files
  const removeNodeFromTree = (nodes: VSCodeFile[], path: string): VSCodeFile[] => {
    return nodes
      .filter((n) => n.path !== path)
      .map((node) => {
        if (node.type === "folder" && node.children) {
          return {
            ...node,
            children: removeNodeFromTree(node.children, path)
          };
        }
        return node;
      });
  };

  // Extract flat list of text files to facilitate searches
  const getFlatFiles = (nodes: VSCodeFile[]): VSCodeFile[] => {
    let result: VSCodeFile[] = [];
    nodes.forEach((n) => {
      if (n.type === "file") {
        result.push(n);
      } else if (n.type === "folder" && n.children) {
        result.push(...getFlatFiles(n.children));
      }
    });
    return result;
  };

  return {
    files: initialFiles,
    openTabs: [],
    activeFilePath: null,
    lastClosedTabs: [],

    activeSidebarTab: "explorer",
    prevActiveSidebarTab: "explorer",
    leftSidebarWidth: 260,
    sidebarCollapsed: false,
    bottomPanelHeight: 230,
    bottomPanelCollapsed: false,
    activeBottomTab: "problems",
    cursorLine: 1,
    cursorColumn: 1,

    searchQuery: "",
    searchCaseSensitive: false,
    searchWholeWord: false,
    searchRegex: false,
    searchMatches: [],

    gitModifiedFiles: [],
    gitCommitMessage: "",
    gitCommitHistory: ["Initial layout draft", "Completed dynamic state sync", "Designed custom regex highlighting"],

    extensions: initialExtensions,
    extensionSearch: "",

    chatMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: `👋 Welcome! I am your **VS Code AI Copilot**.
        
Your workspace is currently clean, empty, and ready to be built.

You can ask me to write code, create scripts, or design files inside this virtual environment! Better yet, ask me to:
👉 **"build a full stack flutter app"** 

I will immediately scaffold a multi-file architecture containing interactive Dart frontends, mock API servers, responsive database managers, and setup configs!`,
        timestamp: "03:15 AM"
      }
    ],
    chatTyping: false,

    showCommandPalette: false,
    commandPaletteQuery: "",
    commandPaletteIndex: 0,
    contextMenu: null,

    terminalInput: "",
    terminalHistory: [],
    terminalBuffer: [
      { text: "Flutter Simulator Workspace Environment Online.", type: "info" },
      { text: "VS Code Core Emulator loaded successfully.", type: "success" },
      { text: "Type 'help' to review simulated operations, or run 'flutter run' to check simulated builds.", type: "normal" },
      { text: "", type: "normal" }
    ],

    settings: {
      indentSize: 2,
      lineEndings: "LF",
      autoSave: "off",
      relativeLineNumbers: false,
      minimap: true,
      theme: "elegant-dark"
    },

    // Global Actions
    toggleSidebar: () => {
      set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
    },
    
    setSidebarTab: (tab) => {
      const { activeSidebarTab, sidebarCollapsed } = get();
      if (tab === null) {
        set({ sidebarCollapsed: true });
      } else if (activeSidebarTab === tab && !sidebarCollapsed) {
        set({ sidebarCollapsed: true });
      } else {
        set({
          activeSidebarTab: tab,
          prevActiveSidebarTab: tab,
          sidebarCollapsed: false
        });
      }
    },

    setLeftSidebarWidth: (w) => {
      if (w < 150) {
        set({ sidebarCollapsed: true });
      } else {
        set({ leftSidebarWidth: Math.min(Math.max(w, 170), 500), sidebarCollapsed: false });
      }
    },

    setBottomPanelHeight: (h) => {
      if (h < 60) {
        set({ bottomPanelCollapsed: true });
      } else {
        set({ bottomPanelHeight: Math.min(Math.max(h, 80), 600), bottomPanelCollapsed: false });
      }
    },

    setBottomPanelCollapsed: (b) => set({ bottomPanelCollapsed: b }),
    
    setBottomTab: (tab) => set({ activeBottomTab: tab, bottomPanelCollapsed: false }),

    setCursorPos: (line, col) => set({ cursorLine: line, cursorColumn: col }),

    // Files navigation
    expandFolder: (path, expand) => {
      set((state) => {
        const fileNode = findFileByPath(state.files, path);
        if (!fileNode) return {};
        const isExp = expand !== undefined ? expand : !fileNode.isExpanded;
        return {
          files: updateFileTreeInNodes(state.files, path, { isExpanded: isExp })
        };
      });
    },

    openFileInTab: (path) => {
      set((state) => {
        const fileNode = findFileByPath(state.files, path);
        if (!fileNode || fileNode.type === "folder") return {};
        
        const alreadyOpen = state.openTabs.some((t) => t.path === path);
        const nextTabs = alreadyOpen 
          ? state.openTabs 
          : [...state.openTabs, { path, isDirty: false }];
          
        return {
          openTabs: nextTabs,
          activeFilePath: path,
          // Collapse right-click contexts
          contextMenu: null
        };
      });
    },

    closeTab: (path) => {
      set((state) => {
        const wasActive = state.activeFilePath === path;
        const remainingTabs = state.openTabs.filter((t) => t.path !== path);
        let nextActive = state.activeFilePath;

        if (wasActive) {
          nextActive = remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1].path : null;
        }

        return {
          openTabs: remainingTabs,
          activeFilePath: nextActive,
          lastClosedTabs: [...state.lastClosedTabs, path]
        };
      });
    },

    closeOtherTabs: (path) => {
      set((state) => ({
        openTabs: state.openTabs.filter((t) => t.path === path),
        activeFilePath: path
      }));
    },

    closeAllTabs: () => {
      set({
        openTabs: [],
        activeFilePath: null
      });
    },

    updateFileContent: (path, newContent) => {
      const { settings, updateFileContent: updateAction } = get();
      
      set((state) => {
        // Track dirty state
        const originalFile = findFileByPath(state.files, path);
        const originalContent = originalFile?.content || "";
        const isCurrentlyDirty = originalContent !== newContent;

        const updatedTabs = state.openTabs.map((tab) => {
          if (tab.path === path) {
            return { ...tab, isDirty: isCurrentlyDirty };
          }
          return tab;
        });

        // Sync with local memory file content
        const updatedFiles = updateFileTreeInNodes(state.files, path, { content: newContent });

        // Compile simulated Git Diff modifications
        const otherModified = state.gitModifiedFiles.filter(item => item.path !== path);
        let updatedGit = state.gitModifiedFiles;
        if (isCurrentlyDirty) {
          const alreadyModified = state.gitModifiedFiles.some(item => item.path === path);
          if (!alreadyModified) {
            updatedGit = [...updatedGit, { path, status: "modified", staged: false }];
          }
        }

        return {
          files: updatedFiles,
          openTabs: updatedTabs,
          gitModifiedFiles: updatedGit
        };
      });

      // Handle autosave delay
      if (settings.autoSave === "delay") {
        if ((window as any)._autosaveTimer) clearTimeout((window as any)._autosaveTimer);
        (window as any)._autosaveTimer = setTimeout(() => {
          get().saveActiveFile();
        }, 1200);
      }
    },

    saveActiveFile: () => {
      set((state) => {
        const active = state.activeFilePath;
        if (!active) return {};

        const updatedTabs = state.openTabs.map((t) => {
          if (t.path === active) {
            return { ...t, isDirty: false };
          }
          return t;
        });

        // Trigger dynamic console alert
        const newTerminalLogs = [
          ...state.terminalBuffer,
          { text: `📝 File Saved: ${active}`, type: "info" as const }
        ];

        return {
          openTabs: updatedTabs,
          terminalBuffer: newTerminalLogs
        };
      });
    },

    createNewFile: (parentPath, name) => {
      const fullPath = parentPath ? `${parentPath}/${name}` : name;
      const newNode: VSCodeFile = {
        name,
        path: fullPath,
        content: `// New file ${name}\n`,
        type: "file"
      };

      set((state) => {
        // Build new tree model
        const updatedFiles = addNewNodeInTree(state.files, parentPath, newNode);

        // Append to tracked git files
        const gitUpdates: GitStatusItem[] = [
          ...state.gitModifiedFiles,
          { path: fullPath, status: "added", staged: false }
        ];

        // Trigger console log
        const termLogs = [
          ...state.terminalBuffer,
          { text: `🆕 Created File: ${fullPath}`, type: "normal" as const }
        ];

        return {
          files: updatedFiles,
          gitModifiedFiles: gitUpdates,
          terminalBuffer: termLogs
        };
      });

      // Set focus to the new file
      get().openFileInTab(fullPath);
    },

    createNewFolder: (parentPath, name) => {
      const fullPath = parentPath ? `${parentPath}/${name}` : name;
      const newNode: VSCodeFile = {
        name,
        path: fullPath,
        type: "folder",
        children: [],
        isExpanded: true
      };

      set((state) => {
        const updatedFiles = addNewNodeInTree(state.files, parentPath, newNode);
        return {
          files: updatedFiles,
          terminalBuffer: [
            ...state.terminalBuffer,
            { text: `📂 Created Folder: ${fullPath}`, type: "normal" as const }
          ]
        };
      });
    },

    renamePath: (oldPath, newName) => {
      set((state) => {
        const parts = oldPath.split("/");
        parts[parts.length - 1] = newName;
        const newPath = parts.join("/");

        // Helper to recursively update all children paths
        const renameInNodes = (nodes: VSCodeFile[]): VSCodeFile[] => {
          return nodes.map((node) => {
            if (node.path === oldPath) {
              const updatedNode: VSCodeFile = { 
                ...node, 
                name: newName, 
                path: newPath 
              };
              if (node.type === "folder" && node.children) {
                const rewriteChildren = (kids: VSCodeFile[]): VSCodeFile[] => {
                  return kids.map((child) => {
                    const relative = child.path.substring(oldPath.length);
                    const childNewPath = newPath + relative;
                    return {
                      ...child,
                      path: childNewPath,
                      children: child.type === "folder" && child.children ? rewriteChildren(child.children) : undefined
                    };
                  });
                };
                updatedNode.children = rewriteChildren(node.children);
              }
              return updatedNode;
            }
            if (node.type === "folder" && node.children) {
              return {
                ...node,
                children: renameInNodes(node.children)
              };
            }
            return node;
          });
        };

        const updatedFiles = renameInNodes(state.files);

        // Update tabs paths as well
        const updatedTabs = state.openTabs.map((tab) => {
          if (tab.path === oldPath) return { ...tab, path: newPath };
          if (tab.path.startsWith(oldPath + "/")) {
            const rel = tab.path.substring(oldPath.length);
            return { ...tab, path: newPath + rel };
          }
          return tab;
        });

        const nextActive = state.activeFilePath === oldPath 
          ? newPath 
          : state.activeFilePath?.startsWith(oldPath + "/") 
            ? newPath + state.activeFilePath.substring(oldPath.length) 
            : state.activeFilePath;

        return {
          files: updatedFiles,
          openTabs: updatedTabs,
          activeFilePath: nextActive,
          terminalBuffer: [
            ...state.terminalBuffer,
            { text: `✏️ Renamed: ${oldPath} ➔ ${newName}`, type: "info" as const }
          ]
        };
      });
    },

    deletePath: (path) => {
      set((state) => {
        const updatedFiles = removeNodeFromTree(state.files, path);
        
        // Remove closed directories and children from open files tabs
        const updatedTabs = state.openTabs.filter(
          (t) => t.path !== path && !t.path.startsWith(path + "/")
        );
        
        let active = state.activeFilePath;
        if (active === path || (active && active.startsWith(path + "/"))) {
          active = updatedTabs.length > 0 ? updatedTabs[updatedTabs.length - 1].path : null;
        }

        return {
          files: updatedFiles,
          openTabs: updatedTabs,
          activeFilePath: active,
          terminalBuffer: [
            ...state.terminalBuffer,
            { text: `🗑️ Deleted: ${path}`, type: "error" as const }
          ]
        };
      });
    },

    // Search Engine
    setSearchQuery: (query) => {
      set({ searchQuery: query });
      get().performSearch();
    },

    toggleSearchCase: () => {
      set((state) => ({ searchCaseSensitive: !state.searchCaseSensitive }));
      get().performSearch();
    },

    toggleSearchWholeWord: () => {
      set((state) => ({ searchWholeWord: !state.searchWholeWord }));
      get().performSearch();
    },

    toggleSearchRegex: () => {
      set((state) => ({ searchRegex: !state.searchRegex }));
      get().performSearch();
    },

    performSearch: () => {
      const { searchQuery, files, searchCaseSensitive, searchWholeWord, searchRegex } = get();
      if (!searchQuery.trim()) {
        set({ searchMatches: [] });
        return;
      }

      const flat = getFlatFiles(files);
      const matches: SearchMatch[] = [];

      flat.forEach((file) => {
        if (!file.content) return;
        const lines = file.content.split("\n");

        lines.forEach((lineText, idx) => {
          let lineNo = idx + 1;
          let searchStr = searchQuery;
          let fileText = lineText;

          if (!searchCaseSensitive) {
            searchStr = searchStr.toLowerCase();
            fileText = fileText.toLowerCase();
          }

          if (searchRegex) {
            try {
              const regexFlags = searchCaseSensitive ? "g" : "gi";
              let rStr = searchQuery;
              if (searchWholeWord) {
                rStr = `\\b${rStr}\\b`;
              }
              const regex = new RegExp(rStr, regexFlags);
              let regexMatch;
              while ((regexMatch = regex.exec(lineText)) !== null) {
                matches.push({
                  filePath: file.path,
                  lineNum: lineNo,
                  lineText: lineText,
                  matchIndex: regexMatch.index,
                  matchLength: regexMatch[0].length
                });
                if (!regex.global) break; // Infinite check protection
              }
            } catch (e) {
              // Ignore invalid regex state
            }
          } else {
            let index = fileText.indexOf(searchStr);
            while (index !== -1) {
              let approveMatch = true;
              if (searchWholeWord) {
                const before = lineText[index - 1];
                const after = lineText[index + searchQuery.length];
                const boundary = /^[a-zA-Z0-9_]$/;
                if (boundary.test(before) || boundary.test(after)) {
                  approveMatch = false;
                }
              }

              if (approveMatch) {
                matches.push({
                  filePath: file.path,
                  lineNum: lineNo,
                  lineText: lineText,
                  matchIndex: index,
                  matchLength: searchQuery.length
                });
              }

              index = fileText.indexOf(searchStr, index + 1);
            }
          }
        });
      });

      set({ searchMatches: matches });
    },

    // Git Simulator
    stageFile: (path, stage) => {
      set((state) => ({
        gitModifiedFiles: state.gitModifiedFiles.map((item) => {
          if (item.path === path) return { ...item, staged: stage };
          return item;
        })
      }));
    },

    stageAllFiles: () => {
      set((state) => ({
        gitModifiedFiles: state.gitModifiedFiles.map(i => ({ ...i, staged: true }))
      }));
    },

    unstageAllFiles: () => {
      set((state) => ({
        gitModifiedFiles: state.gitModifiedFiles.map(i => ({ ...i, staged: false }))
      }));
    },

    setGitMessage: (msg) => set({ gitCommitMessage: msg }),

    commitChanges: () => {
      const { gitCommitMessage, gitModifiedFiles } = get();
      if (!gitCommitMessage.trim()) return;

      const stagedCount = gitModifiedFiles.filter(i => i.staged).length;
      if (stagedCount === 0) {
        set((state) => ({
          terminalBuffer: [
            ...state.terminalBuffer,
            { text: "⚠️ Git Hint: Stage files before attempting to commit.", type: "error" as const }
          ]
        }));
        return;
      }

      set((state) => {
        // Remove committed files from list
        const remainingModified = state.gitModifiedFiles.filter((item) => !item.staged);
        const nextBuffer = [
          ...state.terminalBuffer,
          { text: `[git] Committed ${stagedCount} files successfully: "${gitCommitMessage}"`, type: "success" as const }
        ];

        return {
          gitModifiedFiles: remainingModified,
          gitCommitHistory: [gitCommitMessage, ...state.gitCommitHistory],
          gitCommitMessage: "",
          terminalBuffer: nextBuffer
        };
      });
    },

    // Extensions Store
    toggleExtensionInstall: (id) => {
      set((state) => {
        const nextExts = state.extensions.map((ext) => {
          if (ext.id === id) {
            const willBeInstalled = !ext.installed;
            return { ...ext, installed: willBeInstalled };
          }
          return ext;
        });

        const targetExt = state.extensions.find(e => e.id === id);
        const name = targetExt?.name || "extension";
        const installMsg = targetExt?.installed ? `🔌 Uninstalled Extension: ${name}` : `🔌 Installed Extension: ${name}`;

        return {
          extensions: nextExts,
          terminalBuffer: [
            ...state.terminalBuffer,
            { text: installMsg, type: "info" as const }
          ]
        };
      });
    },

    setExtensionSearch: (query) => set({ extensionSearch: query }),

    // AI Chat Panel - integrated with server endpoint using Gemini Model
    sendChatMessage: async (msgText) => {
      if (!msgText.trim()) return;

      const userMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: "user",
        content: msgText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, userMsg],
        chatTyping: true
      }));

      try {
        const res = await fetch("/api/gemini/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: get().chatMessages.map(m => ({ role: m.role, content: m.content })),
            activeFile: get().activeFilePath,
            activeFileContent: get().activeFilePath ? findFileByPath(get().files, get().activeFilePath || "")?.content : ""
          })
        });

        if (!res.ok) {
          throw new Error("Failed to communicate with LLM AI server");
        }

        const data = await res.json();
        
        const assistantMsg: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          role: "assistant",
          content: data.reply || "I encountered an empty answer. Please type again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const ops = data.operations || [];
        
        // 1. Process deletes instantly
        const deletes = ops.filter((op: any) => op.type === "delete");
        const writes = ops.filter((op: any) => op.type === "create" || op.type === "edit");

        if (deletes.length > 0) {
          set((state) => {
            let updatedFiles = [...state.files];
            let updatedGitModified = [...state.gitModifiedFiles];
            let updatedTabs = [...state.openTabs];
            let updatedActiveFile = state.activeFilePath;
            const updatedTerminalBuffer = [...state.terminalBuffer];

            deletes.forEach((op: any) => {
              const { path } = op;
              if (!path) return;
              updatedFiles = deletePathFromTree(updatedFiles, path);
              updatedGitModified = updatedGitModified.filter((g) => g.path !== path);
              updatedTabs = updatedTabs.filter((t) => t.path !== path);
              if (updatedActiveFile === path) {
                updatedActiveFile = updatedTabs.length > 0 ? updatedTabs[updatedTabs.length - 1].path : null;
              }
              updatedTerminalBuffer.push({
                text: `⚙️ AI Sync: Deleted "${path}"`,
                type: "error" as const
              });
            });

            return {
              files: updatedFiles,
              gitModifiedFiles: updatedGitModified,
              openTabs: updatedTabs,
              activeFilePath: updatedActiveFile,
              terminalBuffer: updatedTerminalBuffer
            };
          });
        }

        // 2. Mount assistant reaction message to chat
        set((state) => ({
          chatMessages: [...state.chatMessages, assistantMsg],
          chatTyping: false
        }));

        // 3. Process writes with beautiful, fast typing/streaming effects sequentially
        if (writes.length > 0) {
          (async () => {
            for (const write of writes) {
              const { type, path, content } = write;
              if (!path) continue;

              // Pre-initialize target in tab layout & file tree empty stub
              set((state) => {
                let updatedFiles = [...state.files];
                let updatedGitModified = [...state.gitModifiedFiles];
                let updatedTabs = [...state.openTabs];
                const updatedTerminalBuffer = [...state.terminalBuffer];

                // Write starting draft outline placeholder
                updatedFiles = upsertFileInTree(updatedFiles, path, "// AI is generating code...\n");

                const gitIdx = updatedGitModified.findIndex((g) => g.path === path);
                if (gitIdx === -1) {
                  updatedGitModified.push({
                    path,
                    status: type === "create" ? "added" : "modified",
                    staged: false
                  });
                } else {
                  updatedGitModified[gitIdx] = {
                    ...updatedGitModified[gitIdx],
                    status: "modified"
                  };
                }

                if (!updatedTabs.some((t) => t.path === path)) {
                  updatedTabs.push({ path, isDirty: false });
                }

                updatedTerminalBuffer.push({
                  text: `⚡ AI typing engine started for "${path}"...`,
                  type: "info" as const
                });

                return {
                  files: updatedFiles,
                  gitModifiedFiles: updatedGitModified,
                  openTabs: updatedTabs,
                  activeFilePath: path, // Focus on active generating file path so user views progression
                  terminalBuffer: updatedTerminalBuffer
                };
              });

              // Slight intro delay
              await new Promise((r) => setTimeout(r, 200));

              // Progressively append chunks/lines of file content over a fast-paced typewriter interval sequence
              const lines = (content || "").split("\n");
              let currentLines: string[] = [];
              const totalLines = lines.length;
              const stepsCount = Math.min(30, totalLines);
              const linesPerStep = Math.max(1, Math.ceil(totalLines / stepsCount));
              
              let currentLineIdx = 0;
              await new Promise<void>((resolve) => {
                const interval = setInterval(() => {
                  if (currentLineIdx >= totalLines) {
                    clearInterval(interval);
                    resolve();
                  } else {
                    const batch = lines.slice(currentLineIdx, currentLineIdx + linesPerStep);
                    currentLines.push(...batch);
                    currentLineIdx += linesPerStep;

                    set((state) => ({
                      files: upsertFileInTree(state.files, path, currentLines.join("\n"))
                    }));
                  }
                }, 30);
              });

              // Seal with 100% exact absolute finalized text
              set((state) => ({
                files: upsertFileInTree(state.files, path, content || ""),
                terminalBuffer: [
                  ...state.terminalBuffer,
                  { text: `✓ Generated file "${path}" successfully!`, type: "success" as const }
                ]
              }));

              await new Promise((r) => setTimeout(r, 100));
            }
          })();
        }
      } catch (err: any) {
        console.error("AI chat Error:", err);
        const errorMsg: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          role: "assistant",
          content: `❌ **Failed to fetch AI reply:** ${err.message || "Is your backend online/authenticated?"}
          
Your workspace GEMINI_API_KEY could be unconfigured or expired. Ensure secrets are configured appropriately.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        set((state) => ({
          chatMessages: [...state.chatMessages, errorMsg],
          chatTyping: false
        }));
      }
    },

    clearChat: () => {
      set({ chatMessages: [] });
    },

    // Command Palette
    setCommandPaletteOpen: (open) => set({ showCommandPalette: open, commandPaletteQuery: "", commandPaletteIndex: 0 }),
    
    setCommandPaletteQuery: (q) => set({ commandPaletteQuery: q, commandPaletteIndex: 0 }),
    
    setCommandPaletteIndex: (idx) => set({ commandPaletteIndex: idx }),

    triggerCommand: (id) => {
      const { 
        toggleSidebar, 
        closeAllTabs, 
        clearTerminal, 
        setSidebarTab, 
        saveActiveFile,
        createNewFile
      } = get();

      // Clear Context Menu overlays
      set({ showCommandPalette: false, contextMenu: null });

      switch (id) {
        case "toggle_sidebar":
          toggleSidebar();
          break;
        case "explorer":
          setSidebarTab("explorer");
          break;
        case "search":
          setSidebarTab("search");
          break;
        case "git":
          setSidebarTab("git");
          break;
        case "extensions":
          setSidebarTab("extensions");
          break;
        case "ai":
          setSidebarTab("ai");
          break;
        case "clear_terminal":
          clearTerminal();
          break;
        case "close_all_tabs":
          closeAllTabs();
          break;
        case "save_file":
          saveActiveFile();
          break;
        case "create_file_root":
          createNewFile(null, "untitled_script.dart");
          break;
        case "download_project":
          set({ activeBottomTab: "output", bottomPanelCollapsed: false });
          set((state) => ({
            terminalBuffer: [
              ...state.terminalBuffer,
              { text: "$ zip -r flutter_vscode_project.zip .", type: "input" as const },
              { text: "📦 Packaging workspace file tree to ZIP...", type: "info" as const },
            ]
          }));

          import("./zipHelper")
            .then(async (module) => {
              const success = await module.downloadProjectAsZip(get().files);
              if (success) {
                set((state) => ({
                  terminalBuffer: [
                    ...state.terminalBuffer,
                    { text: "✓ Zip compilation completed successfully!", type: "success" as const },
                    { text: "📥 Download initiated: flutter_vscode_project.zip", type: "success" as const }
                  ]
                }));
              } else {
                set((state) => ({
                  terminalBuffer: [
                    ...state.terminalBuffer,
                    { text: "❌ Zip packaging failed during serialization.", type: "error" as const }
                  ]
                }));
              }
            })
            .catch((err) => {
              set((state) => ({
                terminalBuffer: [
                  ...state.terminalBuffer,
                  { text: `❌ Package execution error: ${err.message || err}`, type: "error" as const }
                ]
              }));
            });
          break;
        case "run_project":
          set({ activeBottomTab: "output", bottomPanelCollapsed: false });
          get().setTerminalInput("flutter run");
          setTimeout(() => {
            get().runTerminalCommand();
          }, 300);
          break;
        default:
          console.warn(`Command '${id}' executed successfully.`);
      }
    },

    // Context Menu
    setContextMenu: (menu) => set({ contextMenu: menu }),

    // Terminal Commands
    setTerminalInput: (input) => set({ terminalInput: input }),
    
    runTerminalCommand: () => {
      const { terminalInput, terminalBuffer, terminalHistory } = get();
      if (!terminalInput.trim()) return;

      const inputLogs = [
        ...terminalBuffer,
        { text: `$ ${terminalInput}`, type: "input" as const }
      ];

      const command = terminalInput.trim().toLowerCase();
      let responseLogs: { text: string; type: "normal" | "info" | "success" | "error" }[] = [];

      if (command === "help") {
        responseLogs = [
          { text: "💡 Available commands in this VS Code Code Editor Clone:", type: "info" },
          { text: "  - flutter run      : Simulates compiling this project structure with high precision.", type: "normal" },
          { text: "  - git status       : Queries uncommitted staged/unstaged changes.", type: "normal" },
          { text: "  - git add .        : Stages all modified and added files.", type: "normal" },
          { text: "  - git commit -m \"\" : Commits staged updates with standard commit message tagging.", type: "normal" },
          { text: "  - help             : Lists help summaries.", type: "normal" },
          { text: "  - clear            : Clears console outputs.", type: "normal" }
        ];
      } else if (command === "clear") {
        set({ terminalInput: "", terminalBuffer: [] });
        return;
      } else if (command === "flutter run") {
        responseLogs = [
          { text: "⚡ Starting dynamic Flutter Web device simulator compilation...", type: "info" },
          { text: "📝 Parsing Dart files syntax dependencies...", type: "normal" },
          { text: "✓ Found config package bindings in pubspec.yaml", type: "success" },
          { text: "🏃 Compiling target lib/main.dart on Google Chrome debug bridge...", type: "normal" },
          { text: "🔥 Hot Reload interface and websockets live at port: 3000", type: "success" },
          { text: "🎉 Simulated APK build complete! Visual Simulator rendering is optimal.", type: "success" }
        ];
      } else if (command === "git status") {
        const { gitModifiedFiles } = get();
        if (gitModifiedFiles.length === 0) {
          responseLogs = [
            { text: "On branch main", type: "normal" },
            { text: "Your branch is up to date with 'origin/main'.", type: "normal" },
            { text: "nothing to commit, working tree clean", type: "success" }
          ];
        } else {
          responseLogs = [
            { text: "On branch main", type: "normal" },
            { text: "Changes not staged for commit:", type: "info" },
            ...gitModifiedFiles.filter(f => !f.staged).map(f => ({ text: `  (use "git add <file>..." to stage) modified:   ${f.path}`, type: "error" as const })),
            { text: "Changes staged for commit:", type: "success" },
            ...gitModifiedFiles.filter(f => f.staged).map(f => ({ text: `  (use "git restore --staged <file>..." to unstage) modified:   ${f.path}`, type: "success" as const }))
          ];
        }
      } else if (command === "git add .") {
        get().stageAllFiles();
        responseLogs = [
          { text: "✓ All files staged successfully for commit.", type: "success" }
        ];
      } else if (command.startsWith("git commit")) {
        const match = terminalInput.match(/git\s+commit\s+-m\s+["'](.*?)["']/i) || 
                      terminalInput.match(/git\s+commit\s+-m\s+(.*)/i);
        const commitMsg = match ? match[1].replace(/['"]/g, "") : "";
        if (!commitMsg.trim()) {
          responseLogs = [
            { text: "Error: No commit message supplied. Usage: git commit -m \"your message\"", type: "error" }
          ];
        } else {
          const stagedCount = get().gitModifiedFiles.filter(i => i.staged).length;
          if (stagedCount === 0) {
            responseLogs = [
              { text: "⚠️ Git Hint: Stage files using `git add .` before attempting to commit.", type: "error" }
            ];
          } else {
            get().setGitMessage(commitMsg);
            get().commitChanges();
            // Since commitChanges appends to state terminalBuffer directly, let's just clear input and add to history.
            set({
              terminalInput: "",
              terminalHistory: [...terminalHistory, terminalInput]
            });
            return;
          }
        }
      } else {
        responseLogs = [
          { text: `bash: ${terminalInput}: command not found. Type 'help' to review simulated operations.`, type: "error" }
        ];
      }

      set({
        terminalInput: "",
        terminalHistory: [...terminalHistory, terminalInput],
        terminalBuffer: [...inputLogs, ...responseLogs]
      });
    },

    clearTerminal: () => set({ terminalBuffer: [] }),

    // Settings config
    updateSettings: (update) => {
      set((state) => ({ settings: { ...state.settings, ...update } }));
    }
  };
});
