import React from "react";
import { useVSCodeStore } from "../../lib/store";
import { Search, WholeWord, CaseSensitive, Binary, FileText } from "lucide-react";

export function SearchPanel() {
  const {
    searchQuery,
    searchCaseSensitive,
    searchWholeWord,
    searchRegex,
    searchMatches,
    setSearchQuery,
    toggleSearchCase,
    toggleSearchWholeWord,
    toggleSearchRegex,
    openFileInTab
  } = useVSCodeStore();

  // Group search matches by file path
  const groupedMatches = searchMatches.reduce((acc, match) => {
    if (!acc[match.filePath]) {
      acc[match.filePath] = [];
    }
    acc[match.filePath].push(match);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div id="vscode-search-panel" className="h-full flex flex-col min-h-0 bg-[#161622] text-slate-300">
      {/* Header bar */}
      <div className="px-4 py-2 bg-[#12121d] border-b border-slate-800/50">
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748b] font-mono select-none">
          Search: Global Query
        </span>
      </div>

      {/* Input query fields with toggles */}
      <div className="p-3 bg-[#161622] flex flex-col gap-2 shrink-0 border-b border-slate-800/30">
        <div className="relative flex items-center bg-[#0c0c14] border border-slate-850 rounded group focus-within:border-blue-500">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords..."
            className="w-full bg-transparent text-xs text-white pl-8 pr-24 py-2 focus:outline-none font-mono"
          />
          <div className="absolute left-2.5 text-slate-500 group-focus-within:text-blue-400">
            <Search className="w-3.5 h-3.5" />
          </div>

          {/* VS Code styled toggles inside right edge of input box */}
          <div className="absolute right-1 flex items-center gap-0.5">
            <button
              onClick={toggleSearchCase}
              title="Match Case"
              className={`p-1 rounded text-[10px] font-bold font-mono transition ${
                searchCaseSensitive 
                  ? "bg-blue-600/30 text-blue-400 border border-blue-500/25" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <CaseSensitive className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleSearchWholeWord}
              title="Match Whole Word"
              className={`p-1 rounded transition ${
                searchWholeWord 
                  ? "bg-blue-600/30 text-blue-400 border border-blue-500/25" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <WholeWord className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleSearchRegex}
              title="Use Regular Expression (.*)"
              className={`p-1 rounded transition ${
                searchRegex 
                  ? "bg-blue-600/30 text-blue-400 border border-blue-500/25" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Query Matches View list container */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {!searchQuery ? (
          <div className="text-center text-slate-500 text-xs py-8 font-mono select-none">
            Type keyword to search across active files in the project.
          </div>
        ) : searchMatches.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-8 font-mono select-none">
            No results found.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-slate-400 px-1 font-mono">
              Found {searchMatches.length} results in {Object.keys(groupedMatches).length} files
            </div>

            {Object.entries(groupedMatches).map(([filePath, matchesList]) => (
              <div key={filePath} className="flex flex-col">
                {/* File Header */}
                <div className="flex items-center gap-1.5 py-1 px-1 select-none text-slate-200 font-mono text-xs hover:bg-slate-800 rounded mb-1">
                  <FileText className="w-3.5 h-3.5 text-[#10b981]" />
                  <span className="truncate">{filePath.split("/").pop()}</span>
                  <span className="text-[10.5px] text-slate-500 truncate">({filePath})</span>
                </div>

                {/* Match Lines */}
                <div className="flex flex-col pl-3 border-l border-slate-800 border-dashed gap-0.5">
                  {matchesList.map((m, idx) => {
                    const beforeText = m.lineText.substring(0, m.matchIndex);
                    const matchText = m.lineText.substring(m.matchIndex, m.matchIndex + m.matchLength);
                    const afterText = m.lineText.substring(m.matchIndex + m.matchLength);

                    return (
                      <button
                        key={idx}
                        onClick={() => openFileInTab(m.filePath)}
                        className="w-full text-left py-1 px-2 hover:bg-slate-800 text-slate-400 hover:text-white transition rounded flex gap-2 font-mono text-[11px] overflow-hidden"
                      >
                        <span className="text-slate-500 text-right min-w-[18px] select-none">{m.lineNum}</span>
                        <span className="truncate flex-1">
                          {beforeText}
                          <span className="bg-blue-900 text-white font-semibold rounded px-0.5 border-b border-blue-400">{matchText}</span>
                          {afterText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
