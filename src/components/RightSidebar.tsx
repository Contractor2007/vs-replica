import React, { useRef, useCallback } from "react";
import { useVSCodeStore } from "../lib/store";
import { AIChatPanel } from "./AIChatPanel";

export function RightSidebar() {
  const { 
    rightSidebarWidth, 
    rightSidebarCollapsed, 
    setRightSidebarWidth 
  } = useVSCodeStore();

  const resizeRef = useRef<HTMLDivElement>(null);

  const startDragging = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightSidebarWidth;

    const doDrag = (moveEvent: MouseEvent) => {
      // Moves left (smaller clientX) -> increases width
      const deltaX = startX - moveEvent.clientX;
      setRightSidebarWidth(startWidth + deltaX);
    };

    const stopDrag = () => {
      document.removeEventListener("mousemove", doDrag);
      document.removeEventListener("mouseup", stopDrag);
    };

    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
  }, [rightSidebarWidth, setRightSidebarWidth]);

  if (rightSidebarCollapsed) {
    return null;
  }

  return (
    <div 
      id="vscode-right-sidebar" 
      ref={resizeRef}
      className="flex h-full select-none shrink-0 relative bg-[#161622] border-l border-slate-850"
      style={{ width: `${rightSidebarWidth}px` }}
    >
      {/* Resizable drag trigger divider on left edge */}
      <div
        onMouseDown={startDragging}
        className="absolute top-0 left-0 bottom-0 w-1.5 -ml-0.5 cursor-col-resize hover:bg-blue-650 active:bg-blue-600 transition-all z-45"
        title="Drag to resize chat panel"
      />

      <div className="flex-1 h-full min-h-0 flex flex-col overflow-hidden pl-1">
        <AIChatPanel />
      </div>
    </div>
  );
}
