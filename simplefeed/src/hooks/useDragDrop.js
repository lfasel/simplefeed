import { useEffect } from "react";

export function useDragDrop(onDragEnter, onDragLeave, onDragOver, onDrop) {
  useEffect(() => {
    // Ignore non-file drags so text selection/URL drags do not trigger overlay state.
    function hasFiles(e) {
      return Array.from(e.dataTransfer?.types || []).includes("Files");
    }

    function handleDragEnter(e) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      onDragEnter?.();
    }

    function handleDragOver(e) {
      if (!hasFiles(e)) return;
      e.preventDefault();
    }

    function handleDragLeave(e) {
      if (e.target === document.documentElement) {
        onDragLeave?.();
      }
    }

    async function handleDropEvent(e) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      onDragLeave?.();

      // Handle only first file for the current upload flow.
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) {
        await onDrop?.(dropped);
      }
    }

    // Attach global handlers so drop works anywhere in the window.
    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDropEvent);

    return () => {
      // Always clean up listeners when dependencies change.
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDropEvent);
    };
  }, [onDragEnter, onDragLeave, onDragOver, onDrop]);
}
