import React, { useState, useRef, useEffect } from "react";
import { useVSCodeStore } from "../lib/store";
import { Bot, Sparkles, Send, Trash, Code, FileText, ChevronRight } from "lucide-react";

export function AIChatPanel() {
  const { 
    chatMessages, 
    chatTyping, 
    sendChatMessage, 
    clearChat, 
    activeFilePath,
    files,
    activeProjectId,
    activeProjectName
  } = useVSCodeStore();

  const [inputMsg, setInputMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll active thread automatically when messages populate
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    sendChatMessage(inputMsg.trim());
    setInputMsg("");
  };

  // Helper helper to highlight code segments
  const parseMarkdownMessage = (text: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      // Normal Text
      if (matchIndex > lastIndex) {
        parts.push(
          <p key={`text-${lastIndex}`} className="leading-relaxed whitespace-pre-wrap text-xs text-slate-300">
            {text.substring(lastIndex, matchIndex)}
          </p>
        );
      }

      const lang = match[1] || "code";
      const code = match[2];

      parts.push(
        <div key={`code-${matchIndex}`} className="my-2.5 rounded-lg bg-[#090b10] border border-slate-850 overflow-hidden font-mono text-[11px] w-full text-slate-200">
          <div className="bg-[#0e111a] px-3 py-1 text-[10px] text-slate-500 font-bold uppercase flex justify-between items-center border-b border-slate-850">
            <span className="flex items-center gap-1.5 font-bold">
              <Code className="w-3.5 h-3.5 text-blue-450" />
              {lang}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(code);
                alert("Code snippet copied to clipboard!");
              }}
              className="text-[10px] hover:text-white hover:underline transition"
            >
              Copy Code
            </button>
          </div>
          <pre className="p-3 overflow-x-auto overflow-y-hidden max-w-full leading-normal">
            <code>{code}</code>
          </pre>
        </div>
      );

      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(
        <p key={`text-${lastIndex}`} className="leading-relaxed whitespace-pre-wrap text-xs text-slate-300">
          {text.substring(lastIndex)}
        </p>
      );
    }

    return parts;
  };

  return (
    <div id="vscode-ai-chat-panel" className="h-full flex flex-col min-h-0 bg-[#161622] text-slate-300 font-sans">
      {/* Header bar */}
      <div className="px-4 py-2 bg-[#12121d] flex items-center justify-between border-b border-slate-800/50">
        <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 font-mono select-none flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          VS Copilot: Assistant
        </span>
        <button
          onClick={clearChat}
          title="Clear active conversation logs"
          className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded transition"
        >
          <Trash className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Target open document context notification */}
      <div className="bg-[#0b0f1a]/85 border-b border-slate-850 px-3 py-2 flex flex-col gap-1 text-[10px] select-none font-mono text-slate-400">
        {activeProjectId ? (
          <div className="flex items-center gap-1.5 text-emerald-450">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Project Connected: </span>
            <span className="font-bold underline text-emerald-400 truncate max-w-[175px]">{activeProjectName}</span>
            <span className="text-[9px] text-slate-500">(Supabase Sync Active)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
            <span>Sandbox Mode (Offline)</span>
          </div>
        )}
        {activeFilePath && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span>Active File: </span>
            <span className="text-blue-400 truncate max-w-[150px] font-bold">{activeFilePath.split("/").pop()}</span>
          </div>
        )}
      </div>

      {/* Thread messages logs */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin">
        {chatMessages.length === 0 ? (
          <div className="text-center text-slate-500 py-12 text-xs font-mono select-none">
            Encountered empty conversation. Type a message below to start chatting!
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex flex-col gap-1.5 max-w-[90%] ${
                msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              {/* Message author badge headers */}
              <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 select-none px-1">
                {msg.role === "assistant" ? (
                  <>
                    <Bot className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="font-bold text-blue-400">VS COPILOT</span>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-slate-400">DEVELOPER</span>
                  </>
                )}
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message content bubble */}
              <div className={`p-3 rounded-lg text-xs leading-relaxed shadow-md ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none hover:bg-blue-550 transition-colors"
                  : "bg-[#0e0e16] border border-slate-850 text-slate-200 rounded-tl-none"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="space-y-2">{parseMarkdownMessage(msg.content)}</div>
                ) : (
                  <p className="whitespace-pre-wrap font-sans text-xs">{msg.content}</p>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading/Typing animation feedback */}
        {chatTyping && (
          <div className="flex flex-col gap-1.5 mr-auto max-w-[80%] items-start">
            <div className="flex items-center gap-2 font-mono text-[9px] text-slate-500">
              <Bot className="w-3.5 h-3.5 text-blue-400 animate-pulse shrink-0" />
              <span className="font-bold text-blue-400 uppercase">VS Copilot is compiling answer...</span>
            </div>
            <div className="p-3 bg-[#0e0e16] border border-slate-850 rounded-lg rounded-tl-none flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="p-3 bg-[#12121d] shrink-0 border-t border-slate-850">
        <form onSubmit={handleSend} className="relative flex items-center bg-[#07070b] border border-slate-800 rounded-lg overflow-hidden group focus-within:border-blue-500 shadow-inner">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Ask Copilot a code helper query..."
            className="w-full bg-transparent text-xs text-white pl-3.5 pr-11 py-2.5 focus:outline-none font-sans"
            disabled={chatTyping}
          />
          <button
            type="submit"
            disabled={!inputMsg.trim() || chatTyping}
            className={`absolute right-1.5 p-1.5 rounded-md transition duration-150 ${
              inputMsg.trim() && !chatTyping
                ? "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-95"
                : "text-slate-600 cursor-not-allowed bg-transparent"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
