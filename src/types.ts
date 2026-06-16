export interface VSCodeFile {
  name: string;
  path: string;
  content?: string;
  type: "file" | "folder";
  children?: VSCodeFile[];
  isExpanded?: boolean;
}

export interface TabItem {
  path: string;
  isDirty: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface SearchMatch {
  filePath: string;
  lineNum: number;
  lineText: string;
  matchIndex: number;
  matchLength: number;
}

export interface ExtensionItem {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  downloads: string;
  rating: number;
  installed: boolean;
  category: "Linter" | "Language" | "Tool" | "Theme";
}

export interface GitStatusItem {
  path: string;
  status: "added" | "modified" | "deleted";
  staged: boolean;
}

export interface EditorSettings {
  indentSize: 2 | 4;
  lineEndings: "LF" | "CRLF";
  autoSave: "off" | "delay" | "focusLost";
  relativeLineNumbers: boolean;
  minimap: boolean;
  theme: "elegant-dark" | "monokai" | "cobalt" | "github-dark";
}

export interface CommandItem {
  id: string;
  name: string;
  shortcut?: string;
  category: string;
  action: () => void;
}
