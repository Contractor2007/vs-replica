import React from "react";
import { useVSCodeStore } from "../../lib/store";
import { Search, Puzzle, Star, Download, ShieldCheck } from "lucide-react";

export function ExtensionsPanel() {
  const {
    extensions,
    extensionSearch,
    setExtensionSearch,
    toggleExtensionInstall
  } = useVSCodeStore();

  const filteredExtensions = extensions.filter((ext) => {
    const q = extensionSearch.toLowerCase();
    return (
      ext.name.toLowerCase().includes(q) ||
      ext.description.toLowerCase().includes(q) ||
      ext.author.toLowerCase().includes(q)
    );
  });

  return (
    <div id="vscode-extensions-panel" className="h-full flex flex-col min-h-0 bg-[#161622] text-slate-300">
      {/* Header bar */}
      <div className="px-4 py-2 bg-[#12121d] border-b border-slate-800/50">
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748b] font-mono select-none">
          Extensions: Market Place
        </span>
      </div>

      {/* Extension query input */}
      <div className="p-3 shrink-0 bg-[#161622] border-b border-slate-800/30">
        <div className="relative flex items-center bg-[#0c0c14] border border-slate-850 rounded group focus-within:border-blue-500">
          <input
            type="text"
            value={extensionSearch}
            onChange={(e) => setExtensionSearch(e.target.value)}
            placeholder="Search extensions in Marketplace..."
            className="w-full bg-transparent text-xs text-white pl-8 pr-3 py-2 focus:outline-none font-mono"
          />
          <div className="absolute left-2.5 text-slate-500 group-focus-within:text-blue-400">
            <Search className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Extensions list */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 scrollbar-thin">
        {filteredExtensions.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-10 font-mono select-none">
            No extensions found matching search criteria.
          </div>
        ) : (
          filteredExtensions.map((ext) => (
            <div 
              key={ext.id}
              className="p-2.5 bg-[#0e0e16] border border-slate-900 rounded-md hover:border-slate-850 transition duration-150 flex items-start gap-2.5"
            >
              {/* Fake puzzle extension icon */}
              <div className="w-8 h-8 bg-blue-900/40 rounded border border-blue-800/30 flex items-center justify-center shrink-0">
                <Puzzle className="w-4 h-4 text-blue-400" />
              </div>

              {/* Text Meta details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-1.5">
                  <h4 className="text-xs font-bold text-slate-100 font-mono truncate leading-none">
                    {ext.name}
                  </h4>
                  <span className="text-[9px] text-[#64748b] shrink-0 font-mono">
                    {ext.version}
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 font-sans line-clamp-2 leading-relaxed">
                  {ext.description}
                </p>

                {/* Sub row rating metadata */}
                <div className="flex items-center gap-2.5 text-[9px] text-[#64748b] font-mono">
                  <span className="text-slate-300 truncate">By {ext.author}</span>
                  <span className="flex items-center gap-0.5">
                    <Download className="w-2.5 h-2.5 shrink-0" />
                    {ext.downloads}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 text-yellow-500 shrink-0 fill-yellow-500/10" />
                    {ext.rating}
                  </span>
                </div>

                {/* Confirm install CTA action triggers */}
                <div className="flex items-center justify-between pt-1 font-mono">
                  <span className="text-[9px] flex items-center gap-1 text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500/60" />
                    Verified
                  </span>

                  <button
                    onClick={() => toggleExtensionInstall(ext.id)}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition duration-150 tracking-wider ${
                      ext.installed
                        ? "bg-red-950/40 hover:bg-red-805/40 text-red-400 border border-red-900/30 hover:border-red-500/40"
                        : "bg-blue-600 hover:bg-blue-500 text-white active:scale-98"
                    }`}
                  >
                    {ext.installed ? "Uninstall" : "Install"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
