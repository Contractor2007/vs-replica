import React, { useRef, useEffect, useState } from "react";
import { useVSCodeStore } from "../lib/store";
import { X, Save, File, RefreshCw, FileText } from "lucide-react";

export function EditorArea() {
  const {
    openTabs,
    activeFilePath,
    files,
    settings,
    openFileInTab,
    closeTab,
    updateFileContent,
    saveActiveFile,
    setCursorPos,
    cursorLine,
    cursorColumn
  } = useVSCodeStore();

  const [textareaValue, setTextareaValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollSyncRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Keep track of folded lines per file (persistent state mapping)
  const [foldedByFile, setFoldedByFile] = useState<Record<string, number[]>>({});

  // Deep search content helper
  const findContent = (nodes: any[], target: string): string => {
    for (const n of nodes) {
      if (n.path === target) return n.content || "";
      if (n.type === "folder" && n.children) {
        const c = findContent(n.children, target);
        if (c) return c;
      }
    }
    return "";
  };

  const activeContent = activeFilePath ? findContent(files, activeFilePath) : "";

  // 1. Detect all foldable curly-brace regions in the active file
  const foldableRanges = React.useMemo(() => {
    if (!activeContent) return [];
    const lines = activeContent.split("\n");
    const ranges: { start: number; end: number }[] = [];
    const stack: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip commented lines
      if (line.trim().startsWith("//") || line.trim().startsWith("#") || line.trim().startsWith("/*")) {
        continue;
      }
      for (let j = 0; j < line.length; j++) {
        if (line[j] === "{") {
          stack.push(i);
        } else if (line[j] === "}") {
          const start = stack.pop();
          if (start !== undefined && start < i) {
            ranges.push({ start, end: i });
          }
        }
      }
    }
    return ranges.sort((a, b) => a.start - b.start);
  }, [activeContent]);

  // 2. Generate the visual display code and bidirectional line maps
  const { displayCode, mapDisplayToFull, mapFullToDisplay } = React.useMemo(() => {
    if (!activeContent) {
      return { displayCode: "", mapDisplayToFull: [], mapFullToDisplay: [] };
    }
    const foldedArr = foldedByFile[activeFilePath || ""] || [];
    const foldedStarts = new Set(foldedArr);
    const fullLines = activeContent.split("\n");
    const displayLines: string[] = [];
    const mapDisplayToFull: number[] = [];
    const mapFullToDisplay: number[] = [];

    let skipUntilLine = -1;

    for (let i = 0; i < fullLines.length; i++) {
      if (i <= skipUntilLine) {
        mapFullToDisplay.push(-1);
        continue;
      }

      if (foldedStarts.has(i)) {
        const range = foldableRanges.find(r => r.start === i);
        if (range) {
          const lineText = fullLines[i];
          let foldedText = lineText;
          if (lineText.includes("{")) {
            foldedText = lineText.substring(0, lineText.indexOf("{") + 1) + " ... }";
          } else {
            foldedText = lineText + " ...";
          }
          displayLines.push(foldedText);
          mapDisplayToFull.push(i);
          mapFullToDisplay.push(displayLines.length - 1);
          skipUntilLine = range.end;
          continue;
        }
      }

      displayLines.push(fullLines[i]);
      mapDisplayToFull.push(i);
      mapFullToDisplay.push(displayLines.length - 1);
    }

    return {
      displayCode: displayLines.join("\n"),
      mapDisplayToFull,
      mapFullToDisplay
    };
  }, [activeContent, activeFilePath, foldedByFile, foldableRanges]);

  // Sync textarea's local state on switch/folding change
  useEffect(() => {
    setTextareaValue(displayCode);
  }, [displayCode]);

  // Synchronize custom highlights scroll with textarea scroll
  const handleScroll = () => {
    if (textareaRef.current) {
      if (scrollSyncRef.current) {
        scrollSyncRef.current.scrollTop = textareaRef.current.scrollTop;
        scrollSyncRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
      if (gutterRef.current) {
        gutterRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    }
  };

  // Keyboard and formatting listeners
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const spacing = " ".repeat(settings.indentSize);

      const nextVal = textareaValue.substring(0, start) + spacing + textareaValue.substring(end);
      setTextareaValue(nextVal);

      // Save changes back to the root full code content buffer
      const newDisplayLines = nextVal.split("\n");
      const fullLines = activeContent.split("\n");
      if (newDisplayLines.length === mapDisplayToFull.length) {
        newDisplayLines.forEach((dispLine, idx) => {
          const fullIdx = mapDisplayToFull[idx];
          if (fullIdx !== undefined && fullIdx !== -1) {
            fullLines[fullIdx] = dispLine;
          }
        });
        updateFileContent(activeFilePath!, fullLines.join("\n"));
      } else {
        updateFileContent(activeFilePath!, nextVal);
      }

      // Reset selection positions
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + settings.indentSize;
        }
      }, 0);
    }

    if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveActiveFile();
    }
  };

  // Track select / cursor changes & expand if caret targets folded region
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const start = target.selectionStart;
    const lines = target.value.substring(0, start).split("\n");
    const displayLineIdx = lines.length - 1;
    const col = lines[lines.length - 1].length + 1;

    // Trace display cursor line index back to real full code line number
    const realLine = mapDisplayToFull[displayLineIdx] !== undefined 
      ? mapDisplayToFull[displayLineIdx] + 1 
      : displayLineIdx + 1;
    setCursorPos(realLine, col);

    // Auto-unfold code block if caret targets folded region
    const fullLineIdx = mapDisplayToFull[displayLineIdx];
    const currentFolded = foldedByFile[activeFilePath || ""] || [];
    if (fullLineIdx !== undefined && currentFolded.includes(fullLineIdx)) {
      const nextFolded = currentFolded.filter(item => item !== fullLineIdx);
      setFoldedByFile({
        ...foldedByFile,
        [activeFilePath || ""]: nextFolded
      });
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTextareaValue(val);

    const newDisplayLines = val.split("\n");
    const fullLines = activeContent.split("\n");

    if (newDisplayLines.length === mapDisplayToFull.length) {
      newDisplayLines.forEach((dispLine, idx) => {
        const fullIdx = mapDisplayToFull[idx];
        if (fullIdx !== undefined && fullIdx !== -1) {
          fullLines[fullIdx] = dispLine;
        }
      });
      updateFileContent(activeFilePath!, fullLines.join("\n"));
    } else {
      // If lines count changed, unfold all for safety to prevent content loss/shifting
      const hasAnyFolded = (foldedByFile[activeFilePath || ""] || []).length > 0;
      if (!hasAnyFolded) {
        updateFileContent(activeFilePath!, val);
      } else {
        setFoldedByFile({
          ...foldedByFile,
          [activeFilePath || ""]: []
        });
        updateFileContent(activeFilePath!, val);
      }
    }
  };

  const handleToggleFold = (fullLineIdx: number) => {
    const currentFolded = foldedByFile[activeFilePath || ""] || [];
    const nextFolded = new Set(currentFolded);

    if (nextFolded.has(fullLineIdx)) {
      nextFolded.delete(fullLineIdx);
    } else {
      nextFolded.add(fullLineIdx);
    }

    setFoldedByFile({
      ...foldedByFile,
      [activeFilePath || ""]: Array.from(nextFolded)
    });
  };

  // Visual Syntax highlighter code generator
  const highlightCode = (code: string) => {
    if (!code) return <span className="text-slate-650 font-medium italic">Empty file content stub...</span>;

    const tokens = [
      { regex: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, className: "text-[#6a9955]" }, // Single/multi comments
      { regex: /(".*?"|'.*?'|`.*?`)/g, className: "text-[#ce9178]" }, // Strings
      { regex: /\b(import|class|void|return|const|final|super|override|extends|this|get|set|var|dynamic|new)\b/g, className: "text-[#569cd6] font-bold" }, // Keywords
      { regex: /\b(MaterialApp|StatelessWidget|StatefulWidget|Widget|BuildContext|Container|Scaffold|Center|Text|TextField|ThemeData|TextStyle|Color|Colors|List|Function|Key|required|super)\b/g, className: "text-[#4ec9b0]" }, // Custom Types
      { regex: /\b(true|false|null)\b/g, className: "text-[#569cd6]" }, // Booleans
      { regex: /\b(\d+)\b/g, className: "text-[#b5cea8]" } // Numbers
    ];

    let safeHtml = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    tokens.forEach((t) => {
      safeHtml = safeHtml.replace(t.regex, (match) => {
        return `<span class="${t.className}">${match}</span>`;
      });
    });

    return <div dangerouslySetInnerHTML={{ __html: safeHtml }} className="whitespace-pre font-mono leading-relaxed text-[11.5px]" />;
  };

  if (!activeFilePath) {
    return (
      <div id="vscode-editor-empty" className="flex-1 bg-[#1e1e24] flex flex-col justify-center items-center text-center p-8 select-none">
        <div className="w-16 h-16 bg-slate-800/40 rounded-full flex items-center justify-center border border-slate-700/30 mb-4 animate-pulse">
          <FileText className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">No Document Active</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
          Open a file from the left sidebar explorer tree, or click <code className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono">Ctrl+P</code> to invoke the Global Launcher commands palette.
        </p>
      </div>
    );
  }

  const activeTabDetails = openTabs.find((t) => t.path === activeFilePath);
  const isDirty = activeTabDetails?.isDirty || false;

  return (
    <div id="vscode-editor-area" className="flex-1 h-full min-h-0 flex flex-col bg-[#11121d] relative z-30">
      {/* 1. Scrollable Tabs strip row */}
      <div className="h-9 bg-[#141520] border-b border-slate-850 flex items-center shrink-0 overflow-x-auto scrollbar-none select-none z-40 relative">
        {openTabs.map((tab) => {
          const isActive = tab.path === activeFilePath;
          const fileName = tab.path.split("/").pop() || "untitled";

          return (
            <div
              key={tab.path}
              onClick={() => openFileInTab(tab.path)}
              className={`h-full min-w-[120px] max-w-[170px] flex items-center justify-between px-3.5 border-r border-[#151722] cursor-pointer font-mono text-xs select-none transition group relative ${
                isActive
                  ? "bg-[#11121d] text-white border-t-2 border-t-blue-500 font-semibold"
                  : "bg-[#141520] text-slate-400 hover:bg-[#181928] hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <File className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-550"}`} />
                <span className="truncate leading-none">{fileName}</span>
              </div>

              {/* dirty index or close cross button switcher */}
              <div className="flex items-center gap-1 shrink-0 pl-1">
                {tab.isDirty ? (
                  <span 
                    className="h-2 w-2 rounded-full bg-blue-400 transition group-hover:hidden" 
                    title="Document unsaved changes" 
                  />
                ) : null}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.path);
                  }}
                  className={`p-0.5 hover:bg-slate-800 text-slate-500 hover:text-white rounded transition ${
                    tab.isDirty ? "hidden group-hover:block" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Directory Breadcrumbs chips */}
      <div className="h-7 bg-[#10111a] border-b border-slate-850/40 px-4 flex items-center gap-1.5 shrink-0 text-[10.5px] font-mono text-slate-500 select-none">
        <span className="hover:text-slate-350 cursor-pointer">{settings.theme} Workspace</span>
        {activeFilePath.split("/").map((part, index) => (
          <React.Fragment key={index}>
            <span className="text-slate-700">❯</span>
            <span className="hover:text-slate-350 cursor-pointer">{part}</span>
          </React.Fragment>
        ))}
      </div>

      {/* 3. Text Editor sheet */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Line Numbers Gutter with integrated block folding interactive chevrons */}
        <div 
          ref={gutterRef}
          className="w-14 bg-transparent border-r border-[#151722]/20 text-right pr-2 py-4 select-none font-mono text-slate-500 text-xs shrink-0 flex flex-col overflow-hidden max-h-full pointer-events-none z-40 select-none scrollbar-none"
        >
          <div className="flex flex-col pb-12">
            {mapDisplayToFull.map((fullLineIdx, displayLineIdx) => {
              const lineNum = fullLineIdx + 1;
              const highlighted = lineNum === cursorLine;
              const isFoldable = foldableRanges.some(r => r.start === fullLineIdx);
              const isFolded = (foldedByFile[activeFilePath || ""] || []).includes(fullLineIdx);

              return (
                <div 
                  key={displayLineIdx}
                  onClick={() => isFoldable && handleToggleFold(fullLineIdx)}
                  title={isFoldable ? (isFolded ? "Click to Expand Block" : "Click to Collapse Block") : undefined}
                  className={`text-[11.5px] h-[18.6875px] flex items-center justify-end gap-1 px-1 cursor-pointer group transition pointer-events-auto select-none ${
                    highlighted ? "text-blue-400 font-bold bg-blue-950/25 rounded-l border-r-2 border-r-blue-500" : "text-slate-600"
                  }`}
                  style={{ height: "18.6875px" }}
                >
                  {isFoldable && (
                    <span className="text-[10px] text-amber-500/80 group-hover:text-amber-400 group-hover:scale-110 pointer-events-none transition shrink-0 select-none leading-none">
                      {isFolded ? "⊞" : "⊟"}
                    </span>
                  )}
                  <span className="w-5 text-right font-mono font-medium text-[11px] select-none text-slate-500">{lineNum}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Text Area layout overlayed on custom highlight element */}
        <div className="flex-1 h-full relative overflow-hidden">
          {/* Scroll container holding rendering HTML */}
          <div
            ref={scrollSyncRef}
            className="absolute inset-0 p-4 pl-1 pb-12 pointer-events-none overflow-auto font-mono text-[11.5px] leading-relaxed select-text"
          >
            <div ref={highlightRef} className="absolute pr-8 min-h-full">
              {highlightCode(textareaValue)}
            </div>
          </div>

          {/* Interactive Editable textarea layer - completely transparent except for text color caretaker */}
          <textarea
            ref={textareaRef}
            value={textareaValue}
            onChange={handleTextareaChange}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            spellCheck="false"
            className="absolute inset-0 p-4 pl-1 pb-12 bg-transparent text-transparent caret-blue-500 focus:outline-none font-mono text-[11.5px] leading-relaxed overflow-auto w-full h-full resize-none z-10"
            style={{
              fontVariantLigatures: "none",
              whiteSpace: "pre"
            }}
          />
        </div>

        {/* 4. Mini Map container right edge */}
        {settings.minimap && (
          <div 
            className="w-18 bg-[#0c0d14]/75 border-l border-slate-900 pr-1 py-4 flex flex-col font-mono text-[4px] leading-none text-slate-500 select-none overflow-hidden max-h-full shrink-0"
            title="Overview file map"
          >
            {textareaValue.split("\n").slice(0, 110).map((line, idx) => (
              <div 
                key={idx} 
                className="truncate tracking-wide"
                style={{
                  opacity: line.trim() ? 0.45 : 0.05,
                  color: line.includes("import") ? "#569cd6" : line.includes("class") ? "#4ec9b0" : "#a1a1aa"
                }}
              >
                {line.replace(/\s/g, "•")}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
