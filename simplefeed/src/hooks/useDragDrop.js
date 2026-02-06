import { useEffect } from "react";

export function useDragDrop(onDragEnter, onDragLeave, onDragOver, onDrop) {
  useEffect(() => {
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

      const dropped = e.dataTransfer.files?.[0];
      if (dropped) {
        await onDrop?.(dropped);
      }
    }

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDropEvent);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDropEvent);
    };
  }, [onDragEnter, onDragLeave, onDragOver, onDrop]);
}
