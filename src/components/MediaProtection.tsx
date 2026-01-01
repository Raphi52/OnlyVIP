"use client";

import { useEffect } from "react";

/**
 * Global media protection component
 * Prevents right-click, drag, and long-press on images and videos
 */
export function MediaProtection() {
  useEffect(() => {
    // Prevent right-click on images and videos
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "IMG" ||
        target.tagName === "VIDEO" ||
        target.closest("[data-protected]") ||
        target.closest(".media-container") ||
        target.closest(".gallery-item")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Prevent drag on images and videos
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" || target.tagName === "VIDEO") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Prevent keyboard shortcuts for saving
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
      }
      // Ctrl+Shift+I (DevTools) - optional, uncomment if needed
      // if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") {
      //   e.preventDefault();
      // }
    };

    // Add event listeners
    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("keydown", handleKeyDown, true);

    // Cleanup
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  return null;
}
